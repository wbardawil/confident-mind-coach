import { NextResponse } from "next/server";

export const runtime = "nodejs";

import { streamCoaching, resolveCoachModel } from "@/lib/ai/client";
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

  // Tier check — instant reset requires Pro+
  const tier = user.subscriptionTier ?? "free";
  if (tier === "free") {
    return NextResponse.json(
      { error: "Upgrade to Pro to access Instant Reset." },
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

  let systemPrompt = `You are a mental performance coach delivering an INSTANT confidence reset. This person just hit a panic button — they need help RIGHT NOW. No questions, no forms, no back-and-forth. Deliver a powerful, personalized 90-second intervention.

${profileBlock}

${achievementsBlock}

${coachingMemory ? `Coaching context:\n${coachingMemory}` : ""}

Your response must follow this exact structure:

**GROUND (10 seconds):** One powerful grounding statement. Name what's happening without judgment. "You're in the middle of it right now, and that's okay."

**REMIND (30 seconds):** Pull from their ACTUAL Top Ten achievements and strengths. Reference specific evidence of their capability. "You've done [specific thing]. That person didn't disappear."

**GO (15 seconds):** One concrete next action they can take in the next 60 seconds. Physical if possible — breathe, stand, move. Then one mental cue to carry forward.

Keep it concise, warm, and grounded in THEIR evidence — not generic platitudes. Talk to them like you know them, because you do. This is a 90-second intervention, not a therapy session.`;

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

  const stream = streamCoaching({
    systemPrompt,
    messages,
    model: coachModel,
    maxTokens: 600,
    temperature: 0.7,
  });

  const encoder = new TextEncoder();
  let fullResponse = "";

  const streamResponse = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
            );
          }
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
