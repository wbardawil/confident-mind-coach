"use server";

import { db } from "@/lib/utils/db";

/**
 * Increment the evidenceCount on a ConfidenceGoal when a ledger deposit is linked.
 * Safe to call with null/empty goalId — it's a no-op.
 */
export async function incrementGoalEvidence(goalId: string | null | undefined) {
  if (!goalId) return;
  await db.confidenceGoal.update({
    where: { id: goalId },
    data: { evidenceCount: { increment: 1 } },
  });
}
