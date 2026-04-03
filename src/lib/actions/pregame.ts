"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { writeJournalEntry } from "@/lib/coaching/journal";
import { getCurrentUser } from "@/lib/utils/user";
import { buildPregamePrompt } from "@/lib/coaching/pregame";
import { pregameResponseSchema, type PregameResponse } from "@/lib/ai/schemas";
import { pregameInputSchema, type PregameInput } from "@/lib/validators/pregame";
import { COACHING_MODES, LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";
import { incrementGoalEvidence } from "@/lib/actions/goal-evidence";
import { coerceToNumber } from "@/lib/utils/coerce";
import {
  runCoachingFlow,
  type CoachingFlaggedResult,
  type CoachingErrorResult,
} from "@/lib/actions/run-coaching-flow";

// ─── Return types ──────────────────────────────

interface PregameSuccessResult {
  success: true;
  data: PregameResponse;
}

export type PregameResult = PregameSuccessResult | CoachingFlaggedResult | CoachingErrorResult;

// ─── Main action ───────────────────────────────

export async function submitPregame(data: PregameInput): Promise<PregameResult> {
  const outcome = await runCoachingFlow(data, {
    mode: COACHING_MODES.PREGAME,
    inputSchema: pregameInputSchema,
    responseSchema: pregameResponseSchema,
    coerce: (raw) => ({
      ...raw,
      confidenceLevel: coerceToNumber(raw.confidenceLevel),
    }),
    safetyFields: (input) => [input.upcomingEvent, input.fear, input.definitionOfSuccess],
    buildPrompt: (input, user) =>
      buildPregamePrompt({
        upcomingEvent: input.upcomingEvent,
        confidenceLevel: input.confidenceLevel,
        fear: input.fear,
        definitionOfSuccess: input.definitionOfSuccess,
        profile: user.profile
          ? {
              role: user.profile.role,
              strengths: user.profile.strengths,
            }
          : null,
      }),
  });

  if (!outcome.ok) return outcome.result;

  const { user, input, aiData } = outcome;

  // Persist CoachingSession + LedgerEntry atomically
  await db.$transaction([
    db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.PREGAME,
        inputJson: input as unknown as Prisma.InputJsonValue,
        outputJson: aiData as unknown as Prisma.InputJsonValue,
        flagged: false,
      },
    }),
    db.ledgerEntry.create({
      data: {
        userId: user.id,
        type: LEDGER_TYPES.DEPOSIT,
        title: "Pregame Preparation",
        description: `Prepared for: ${input.upcomingEvent}`,
        scoreDelta: 2,
        sourceType: LEDGER_SOURCE_TYPES.PREGAME,
        goalId: input.goalId || null,
      },
    }),
  ]);

  await incrementGoalEvidence(input.goalId || null);

  writeJournalEntry({
    userId: user.id,
    type: "pregame",
    context: `Pregame — Event: ${input.upcomingEvent} | Confidence: ${input.confidenceLevel}/10 | Fear: ${input.fear} | Success definition: ${input.definitionOfSuccess}\n\nCoach takeStock: ${aiData.takeStock}\nEnough statement: ${aiData.enoughStatement}`,
  });

  revalidatePath("/pregame");
  revalidatePath("/dashboard");
  revalidatePath("/ledger");

  return {
    success: true,
    data: aiData,
  };
}

// ─── Read past sessions ────────────────────────

export async function getRecentPregameSessions(limit = 5) {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.coachingSession.findMany({
    where: { userId: user.id, mode: COACHING_MODES.PREGAME, flagged: false },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      inputJson: true,
      outputJson: true,
      createdAt: true,
    },
  });
}
