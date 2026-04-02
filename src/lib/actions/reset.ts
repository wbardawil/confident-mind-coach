"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { writeJournalEntry } from "@/lib/coaching/journal";
import { getCurrentUser } from "@/lib/utils/user";
import { buildResetPrompt } from "@/lib/coaching/reset";
import { resetResponseSchema, type ResetResponse } from "@/lib/ai/schemas";
import { resetInputSchema, type ResetInput } from "@/lib/validators/reset";
import { COACHING_MODES, LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";
import { coerceToNumber } from "@/lib/utils/coerce";
import {
  runCoachingFlow,
  type CoachingFlaggedResult,
  type CoachingErrorResult,
} from "@/lib/actions/run-coaching-flow";

// ─── Return types ──────────────────────────────

interface ResetSuccessResult {
  success: true;
  data: ResetResponse;
}

export type ResetResult = ResetSuccessResult | CoachingFlaggedResult | CoachingErrorResult;

// ─── Main action ───────────────────────────────

export async function submitReset(data: ResetInput): Promise<ResetResult> {
  const outcome = await runCoachingFlow(data, {
    mode: COACHING_MODES.RESET,
    inputSchema: resetInputSchema,
    responseSchema: resetResponseSchema,
    coerce: (raw) => ({
      ...raw,
      confidenceScore: coerceToNumber(raw.confidenceScore),
    }),
    safetyFields: (input) => [input.eventDescription, input.emotionalState],
    buildPrompt: (input, user) =>
      buildResetPrompt({
        eventDescription: input.eventDescription,
        emotionalState: input.emotionalState,
        confidenceScore: input.confidenceScore,
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

  // Persist CoachingSession + AI-assessed ledger entries atomically.
  await db.$transaction([
    db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.RESET,
        inputJson: input as unknown as Prisma.InputJsonValue,
        outputJson: aiData as unknown as Prisma.InputJsonValue,
        flagged: false,
      },
    }),

    // AI-assessed withdrawal (severity based on context, scope, and impact)
    db.ledgerEntry.create({
      data: {
        userId: user.id,
        type: LEDGER_TYPES.WITHDRAWAL,
        title: aiData.withdrawalImpact.title,
        description: aiData.withdrawalImpact.description,
        scoreDelta: aiData.withdrawalImpact.scoreDelta,
        sourceType: LEDGER_SOURCE_TYPES.RESET,
        goalId: input.goalId || null,
      },
    }),

    // AI-assessed recovery deposit (earned by doing the Reset)
    db.ledgerEntry.create({
      data: {
        userId: user.id,
        type: LEDGER_TYPES.DEPOSIT,
        title: aiData.recoveryImpact.title,
        description: aiData.recoveryImpact.description,
        scoreDelta: aiData.recoveryImpact.scoreDelta,
        sourceType: LEDGER_SOURCE_TYPES.RESET,
        goalId: input.goalId || null,
      },
    }),
  ]);

  // Fire-and-forget: coaching notes
  writeJournalEntry({
    userId: user.id,
    type: "reset",
    context: `Reset — What happened: ${input.eventDescription} | Emotional state: ${input.emotionalState} | Confidence: ${input.confidenceScore}/10\n\nCoach acknowledgement: ${aiData.acknowledgement}\nSafeguard: ${aiData.safeguard}\nNext action: ${aiData.nextActionCue}\nWithdrawal: ${aiData.withdrawalImpact.scoreDelta} | Recovery: +${aiData.recoveryImpact.scoreDelta}`,
  });

  revalidatePath("/reset");
  revalidatePath("/dashboard");
  revalidatePath("/ledger");

  return {
    success: true,
    data: aiData,
  };
}

// ─── Read past sessions ────────────────────────

export async function getRecentResetSessions(limit = 5) {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.coachingSession.findMany({
    where: { userId: user.id, mode: COACHING_MODES.RESET, flagged: false },
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
