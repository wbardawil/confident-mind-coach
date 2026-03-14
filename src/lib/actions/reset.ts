"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { buildResetPrompt } from "@/lib/coaching/reset";
import { resetResponseSchema, type ResetResponse } from "@/lib/ai/schemas";
import { resetInputSchema, type ResetInput } from "@/lib/validators/reset";
import { COACHING_MODES, LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";
import { detectDistress } from "@/lib/utils/distress-detect";
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

  // Detect distress → optional withdrawal (text signals + confidence score)
  const distress = detectDistress({
    eventDescription: input.eventDescription,
    emotionalState: input.emotionalState,
    confidenceScore: input.confidenceScore,
  });

  // Persist CoachingSession + ledger entries as ONE atomic event.
  //
  // A successful Reset is a single product concept: "I did a Reset, here
  // is the coaching I received, and here is its confidence impact."  If any
  // write fails, the entire event should roll back so the user can retry
  // cleanly without orphaned sessions or half-state ledger entries.
  //
  // Note: the *flagged* and *AI-parse-failure* CoachingSession writes
  // are handled by runCoachingFlow and intentionally stay outside this
  // transaction — they are error-path logs, not part of a successful event.
  const persistOps: Prisma.PrismaPromise<unknown>[] = [
    db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.RESET,
        inputJson: input as unknown as Prisma.InputJsonValue,
        outputJson: aiData as unknown as Prisma.InputJsonValue,
        flagged: false,
      },
    }),
  ];

  if (distress.detected) {
    persistOps.push(
      db.ledgerEntry.create({
        data: {
          userId: user.id,
          type: LEDGER_TYPES.WITHDRAWAL,
          title: "Confidence Dip",
          description: `Setback signals: ${distress.matchedSignals.join(", ")}`,
          scoreDelta: distress.withdrawalScore,
          sourceType: LEDGER_SOURCE_TYPES.RESET,
        },
      }),
    );
  }

  // Always create recovery deposit (the act of resetting itself is positive)
  persistOps.push(
    db.ledgerEntry.create({
      data: {
        userId: user.id,
        type: LEDGER_TYPES.DEPOSIT,
        title: "Reset Recovery",
        description: `Reset after: ${input.eventDescription.slice(0, 80)}`,
        scoreDelta: 2,
        sourceType: LEDGER_SOURCE_TYPES.RESET,
      },
    }),
  );

  await db.$transaction(persistOps);

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
