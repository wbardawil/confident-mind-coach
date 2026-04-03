"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { writeJournalEntry } from "@/lib/coaching/journal";
import { buildEspPrompt } from "@/lib/coaching/esp";
import { espResponseSchema, type EspResponse } from "@/lib/ai/schemas";
import { espInputSchema, type EspInput } from "@/lib/validators/esp";
import { COACHING_MODES, LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";
import { incrementGoalEvidence } from "@/lib/actions/goal-evidence";
import {
  runCoachingFlow,
  type CoachingFlaggedResult,
  type CoachingErrorResult,
} from "@/lib/actions/run-coaching-flow";

// ─── Return types ──────────────────────────────

interface EspSuccessResult {
  success: true;
  data: {
    reflection: string;
    affirmation: string;
    ledgerImpact: EspResponse["ledgerImpact"];
  };
}

export type EspResult = EspSuccessResult | CoachingFlaggedResult | CoachingErrorResult;

// ─── Main action ───────────────────────────────

export async function submitEsp(data: EspInput): Promise<EspResult> {
  const outcome = await runCoachingFlow(data, {
    mode: COACHING_MODES.ESP,
    inputSchema: espInputSchema,
    responseSchema: espResponseSchema,
    safetyFields: (input) => [input.effort, input.success, input.progress],
    buildPrompt: (input, user) =>
      buildEspPrompt({
        effort: input.effort,
        success: input.success,
        progress: input.progress,
        userId: user.id,
        profile: user.profile
          ? {
              role: user.profile.role,
              performanceDomain: user.profile.performanceDomain,
              strengths: user.profile.strengths,
            }
          : null,
      }),
  });

  if (!outcome.ok) return outcome.result;

  const { user, input, aiData } = outcome;

  // Persist all records atomically using an interactive transaction
  // because Affirmation and LedgerEntry need ESPEntry.id as sourceId.
  await db.$transaction(async (tx) => {
    const espEntry = await tx.eSPEntry.create({
      data: {
        userId: user.id,
        effort: input.effort,
        success: input.success,
        progress: input.progress,
      },
    });

    await tx.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.ESP,
        inputJson: input as unknown as Prisma.InputJsonValue,
        outputJson: aiData as unknown as Prisma.InputJsonValue,
        flagged: false,
      },
    });

    await tx.affirmation.create({
      data: {
        userId: user.id,
        text: aiData.affirmation,
        source: COACHING_MODES.ESP,
        sourceId: espEntry.id,
      },
    });

    // Only create a ledger deposit if the AI scored > 0 (quality gate)
    if (aiData.ledgerImpact.scoreDelta > 0) {
      await tx.ledgerEntry.create({
        data: {
          userId: user.id,
          type: LEDGER_TYPES.DEPOSIT,
          title: aiData.ledgerImpact.title,
          description: aiData.ledgerImpact.description,
          scoreDelta: aiData.ledgerImpact.scoreDelta,
          sourceId: espEntry.id,
          sourceType: LEDGER_SOURCE_TYPES.ESP,
          goalId: input.goalId || null,
        },
      });
    }
  });

  // Increment goal evidence count if linked
  await incrementGoalEvidence(input.goalId || null);

  // Fire-and-forget: AI writes coaching notes about this interaction
  writeJournalEntry({
    userId: user.id,
    type: "esp",
    context: `ESP Entry — Effort: ${input.effort} | Success: ${input.success} | Progress: ${input.progress}\n\nCoach reflection: ${aiData.reflection}\nAffirmation given: ${aiData.affirmation}`,
  });

  revalidatePath("/daily-esp");
  revalidatePath("/dashboard");
  revalidatePath("/ledger");

  return {
    success: true,
    data: {
      reflection: aiData.reflection,
      affirmation: aiData.affirmation,
      ledgerImpact: aiData.ledgerImpact,
    },
  };
}

// ─── Read past entries ─────────────────────────

export async function getRecentEspEntries(limit = 5) {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.eSPEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getRecentEspSessions(limit = 5) {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.coachingSession.findMany({
    where: { userId: user.id, mode: COACHING_MODES.ESP, flagged: false },
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
