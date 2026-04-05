import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { streamCoaching, resolveCoachModel } from "@/lib/ai/client";
import { logUsage } from "@/lib/ai/usage-logger";
import { getCoachingMemory } from "@/lib/coaching/memory";
import { getEffectiveModel } from "@/lib/stripe/gate";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tier check — instant reset requires Coach plan+
  const bypass = true; // TODO: revert when Stripe is live
  const tier = bypass ? "elite" : (user.subscriptionTier ?? "free");
  if (tier === "free" || tier === "confident") {
    return NextResponse.json(
      { error: "Upgrade to the Coach plan to access Instant Reset." },
      { status: 403 },
    );
  }

  const profile = user.profile;

  // Pull everything we know about this person — no user input needed
  const [achievements, coachingMemory, coachModel] = await Promise.all([
    db.achievement.findMany({
      where: { userId: user.id },
      orderBy: { rank: "asc" },
      take: 10,
      select: { title: true, description: true },
    }),
    getCoachingMemory(user.id),
    resolveCoachModel(getEffectiveModel(tier, profile?.coachModel ?? "haiku-4.5")),
  ]);

  const profileBlock = profile
    ? `This person is a ${profile.role} in ${profile.performanceDomain}. Strengths: ${profile.strengths.join(", ")}. Confidence challenges: ${profile.confidenceChallenges.join(", ")}.`
    : "";

  const achievementsBlock =
    achievements.length > 0
      ? `Their Top Ten confidence memories:\n${achievements.map((a, i) => `${i + 1}. ${a.title} — ${a.description}`).join("\n")}`
      : "";

  // Randomize approach so each reset feels fresh
  const approaches = [
    "Start with a breathing cue — tell them to take one deep breath before you say anything else.",
    "Start with their strongest evidence — lead with the most powerful achievement from their Top Ten.",
    "Start with a direct challenge — call out the doubt and counter it with a fact.",
    "Start with physical grounding — tell them to feel their feet on the floor, hands on the desk.",
    "Start by naming the feeling — acknowledge exactly what they're going through right now.",
  ];
  const approach = approaches[Math.floor(Math.random() * approaches.length)];

  let systemPrompt = `You are a mental performance coach delivering an INSTANT confidence reset. This person hit the panic button — help them NOW.

${profileBlock}

${achievementsBlock}

${coachingMemory ? `Coaching context:\n${coachingMemory}` : ""}

APPROACH FOR THIS RESET: ${approach}

FORMAT RULES (critical):
- 4-5 SHORT sentences. Each sentence gets its own paragraph (double newline between them).
- One idea per sentence. No compound sentences. No dashes or semicolons joining thoughts.
- Keep each sentence under 20 words.
- No headers, labels, bold, or structure markers.
- End with ONE concrete 30-second action on its own line.

CONTENT RULES:
- Reference THEIR specific evidence and achievements — not generic advice.
- Vary your tone and opening every time.
- This should feel like a text from a coach who knows you, not an essay.`;

  // Inject language preference
  const language = profile?.language;
  if (language && language !== "English") {
    systemPrompt += `\n\nIMPORTANT: Respond entirely in ${language}.`;
  }

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    {
      role: "user",
      content: "I need help right now. Reset me.",
    },
  ];

  const resetStartTime = Date.now();
  const stream = streamCoaching({
    systemPrompt,
    messages,
    model: coachModel,
    maxTokens: 150,
    temperature: 0.7,
  });

  const encoder = new TextEncoder();

  const streamResponse = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
        }

        // Log usage
        try {
          const finalMessage = await stream.finalMessage();
          const usage = finalMessage.usage;
          logUsage({
            userId: user.id,
            feature: "instant-reset",
            model: finalMessage.model,
            inputTokens: usage.input_tokens ?? 0,
            outputTokens: usage.output_tokens ?? 0,
            cacheReadTokens: (usage as unknown as Record<string, number>).cache_read_input_tokens ?? 0,
            cacheWriteTokens: (usage as unknown as Record<string, number>).cache_creation_input_tokens ?? 0,
            latencyMs: Date.now() - resetStartTime,
          });
        } catch {
          // Usage logging should never block the response
        }

        // Log as a ledger deposit — showing up and resetting is always positive
        await db.ledgerEntry.create({
          data: {
            userId: user.id,
            type: LEDGER_TYPES.DEPOSIT,
            title: "Instant Reset",
            description: "Used the panic button to regain composure",
            scoreDelta: 1,
            sourceType: LEDGER_SOURCE_TYPES.INSTANT_RESET,
          },
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`),
        );
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Reset unavailable";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new Response(streamResponse, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
