import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

import { streamCoaching, resolveCoachModel, getModelLabel } from "@/lib/ai/client";
import { logUsage } from "@/lib/ai/usage-logger";
import { writeJournalEntry } from "@/lib/coaching/journal";
import { buildCoachSystemPrompt, buildChatMessages } from "@/lib/coaching/coach";
import { getCoachingMemory } from "@/lib/coaching/memory";
import { getEffectiveModel } from "@/lib/stripe/gate";
import { scanForCrisis } from "@/lib/safety/crisis-detect";
import { ESCALATION_MESSAGE } from "@/lib/safety/escalation";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { chatMessageSchema } from "@/lib/validators/coach";

export async function POST(req: NextRequest) {
  // 1. Auth
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1b. Tier check — conversational coach requires Pro+
  const bypass = true; // TODO: revert when Stripe is live
  const tier = bypass ? "elite" : (user.subscriptionTier ?? "free");
  if (tier === "free") {
    return NextResponse.json(
      { error: "Upgrade to Pro to access the conversational coach." },
      { status: 403 },
    );
  }

  // 2. Validate input
  const body = await req.json();
  const parsed = chatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { message, sessionId } = parsed.data;

  // 3. Safety scan
  const safety = scanForCrisis([message]);
  if (safety.flagged) {
    // Persist the flagged message
    const session = sessionId
      ? await db.chatSession.findFirst({ where: { id: sessionId, userId: user.id } })
      : await db.chatSession.create({ data: { userId: user.id, title: message.slice(0, 80) } });

    if (session) {
      await db.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "user",
          content: message,
          flagged: true,
          flaggedReason: safety.reason,
        },
      });
    }

    return NextResponse.json({
      flagged: true,
      escalation: ESCALATION_MESSAGE,
      sessionId: session?.id,
    });
  }

  // 4. Get or create session
  let session = sessionId
    ? await db.chatSession.findFirst({ where: { id: sessionId, userId: user.id } })
    : null;

  if (!session) {
    session = await db.chatSession.create({
      data: { userId: user.id, title: message.slice(0, 80) },
    });
  }

  // 5. Persist user message
  await db.chatMessage.create({
    data: { sessionId: session.id, role: "user", content: message },
  });

  // 6. Load conversation history
  const history = await db.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 20,
    select: { role: true, content: true },
  });

  // 7. Build system prompt with profile + achievements + coaching memory
  const profile = user.profile;
  const [achievements, coachingMemory] = await Promise.all([
    db.achievement.findMany({
      where: { userId: user.id },
      orderBy: { rank: "asc" },
      take: 10,
      select: { title: true, description: true },
    }),
    getCoachingMemory(user.id, tier),
  ]);

  let systemPrompt = buildCoachSystemPrompt(
    profile
      ? {
          role: profile.role,
          performanceDomain: profile.performanceDomain,
          strengths: profile.strengths,
          confidenceChallenges: profile.confidenceChallenges,
          recurringTriggers: profile.recurringTriggers,
          baselineScore: profile.baselineScore,
        }
      : null,
    achievements,
    coachingMemory,
  );

  // Inject language preference
  const language = profile?.language;
  if (language && language !== "English") {
    systemPrompt += `\n\nIMPORTANT: Respond entirely in ${language}. All coaching responses must be in ${language}. Maintain your coaching style and methodology regardless of language.`;
  }

  const messages = buildChatMessages(history);

  // 8. Stream the response using the user's preferred model (gated by tier)
  const modelPreference = profile?.coachModel ?? null;
  const effectivePreference = getEffectiveModel(tier, modelPreference ?? "haiku-4.5");
  const coachModel = await resolveCoachModel(effectivePreference);
  const resolvedLabel = getModelLabel(effectivePreference);
  const streamStartTime = Date.now();
  const stream = streamCoaching({ systemPrompt, messages, model: coachModel });

  // 9. Build a ReadableStream that forwards text deltas and persists the result
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

        // Log usage from the final message
        try {
          const finalMessage = await stream.finalMessage();
          const usage = finalMessage.usage;
          logUsage({
            userId: user.id,
            feature: "coach",
            model: finalMessage.model,
            inputTokens: usage.input_tokens ?? 0,
            outputTokens: usage.output_tokens ?? 0,
            cacheReadTokens: (usage as unknown as Record<string, number>).cache_read_input_tokens ?? 0,
            cacheWriteTokens: (usage as unknown as Record<string, number>).cache_creation_input_tokens ?? 0,
            latencyMs: Date.now() - streamStartTime,
          });
        } catch {
          // Usage logging should never block the response
        }

        // Persist assistant message
        await db.chatMessage.create({
          data: {
            sessionId: session!.id,
            role: "assistant",
            content: fullResponse,
          },
        });

        // Fire-and-forget: coach writes session notes
        const lastUserMsg = messages[messages.length - 1]?.content ?? "";
        writeJournalEntry({
          userId: user.id,
          type: "session",
          sourceId: session!.id,
          context: `Chat session — User said: "${lastUserMsg.slice(0, 300)}"\n\nCoach responded: "${fullResponse.slice(0, 300)}"`,
        });

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, sessionId: session!.id, model: resolvedLabel })}\n\n`,
          ),
        );
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Coaching unavailable";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMessage })}\n\n`,
          ),
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
