import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

import { streamCoaching, resolveCoachModel, getModelLabel } from "@/lib/ai/client";
import { buildCoachSystemPrompt, buildChatMessages } from "@/lib/coaching/coach";
import { getCoachingMemory } from "@/lib/coaching/memory";
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
    getCoachingMemory(user.id),
  ]);

  const systemPrompt = buildCoachSystemPrompt(
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

  const messages = buildChatMessages(history);

  // 8. Stream the response using the user's preferred model
  const modelPreference = profile?.coachModel ?? null;
  const coachModel = await resolveCoachModel(modelPreference);
  const resolvedLabel = getModelLabel(modelPreference);
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

        // Persist assistant message
        await db.chatMessage.create({
          data: {
            sessionId: session!.id,
            role: "assistant",
            content: fullResponse,
          },
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
