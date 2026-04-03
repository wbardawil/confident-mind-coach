"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { writeJournalEntry } from "@/lib/coaching/journal";
import { getCurrentUser } from "@/lib/utils/user";
import { buildAarPrompt } from "@/lib/coaching/aar";
import { aarResponseSchema, type AarResponse } from "@/lib/ai/schemas";
import { aarInputSchema, type AarInput } from "@/lib/validators/aar";
import { COACHING_MODES, LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";
import { incrementGoalEvidence } from "@/lib/actions/goal-evidence";
import {
  runCoachingFlow,
  type CoachingFlaggedResult,
  type CoachingErrorResult,
} from "@/lib/actions/run-coaching-flow";

// ─── Return types ──────────────────────────────

interface AarSuccessResult {
  success: true;
  data: AarResponse;
}

export type AarResult = AarSuccessResult | CoachingFlaggedResult | CoachingErrorResult;

// ─── Main action ───────────────────────────────

export async function submitAar(data: AarInput): Promise<AarResult> {
  const outcome = await runCoachingFlow(data, {
    mode: COACHING_MODES.AAR,
    inputSchema: aarInputSchema,
    responseSchema: aarResponseSchema,
    safetyFields: (input) => [input.whatHappened, input.soWhat, input.nowWhat],
    buildPrompt: (input, user) =>
      buildAarPrompt({
        whatHappened: input.whatHappened,
        soWhat: input.soWhat,
        nowWhat: input.nowWhat,
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
  const dbOps: Prisma.PrismaPromise<unknown>[] = [
    db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.AAR,
        inputJson: input as unknown as Prisma.InputJsonValue,
        outputJson: aiData as unknown as Prisma.InputJsonValue,
        flagged: false,
      },
    }),
  ];

  // Only create a ledger deposit if the AI scored > 0 (quality gate)
  if (aiData.ledgerImpact.scoreDelta > 0) {
    dbOps.push(
      db.ledgerEntry.create({
        data: {
          userId: user.id,
          type: LEDGER_TYPES.DEPOSIT,
          title: aiData.ledgerImpact.title,
          description: aiData.ledgerImpact.description,
          scoreDelta: aiData.ledgerImpact.scoreDelta,
          sourceType: LEDGER_SOURCE_TYPES.AAR,
          goalId: input.goalId || null,
        },
      }),
    );
  }

  await db.$transaction(dbOps);

  await incrementGoalEvidence(input.goalId || null);

  writeJournalEntry({
    userId: user.id,
    type: "aar",
    context: `AAR — What happened: ${input.whatHappened} | So what: ${input.soWhat} | Now what: ${input.nowWhat}\n\nCoach lessons: ${aiData.lessonsLearned}\nImprovement plan: ${aiData.improvementPlan}`,
  });

  revalidatePath("/aar");
  revalidatePath("/dashboard");
  revalidatePath("/ledger");

  return {
    success: true,
    data: aiData,
  };
}

// ─── Read past sessions ────────────────────────

export async function getRecentAarSessions(limit = 5) {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.coachingSession.findMany({
    where: { userId: user.id, mode: COACHING_MODES.AAR, flagged: false },
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
