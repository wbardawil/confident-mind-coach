"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { scanForCrisis } from "@/lib/safety/crisis-detect";
import { ESCALATION_MESSAGE } from "@/lib/safety/escalation";
import { buildResetPrompt } from "@/lib/coaching/reset";
import { generateCoaching } from "@/lib/ai/client";
import { resetResponseSchema, type ResetResponse } from "@/lib/ai/schemas";
import { parseAiResponse } from "@/lib/ai/parse";
import { resetInputSchema, type ResetInput } from "@/lib/validators/reset";
import { COACHING_MODES, LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";

// ─── Return types ──────────────────────────────

interface ResetSuccessResult {
  success: true;
  data: ResetResponse;
}

interface ResetFlaggedResult {
  success: false;
  flagged: true;
  escalation: typeof ESCALATION_MESSAGE;
}

interface ResetErrorResult {
  success: false;
  flagged?: false;
  error: string;
}

export type ResetResult = ResetSuccessResult | ResetFlaggedResult | ResetErrorResult;

// ─── Main action ───────────────────────────────

export async function submitReset(data: ResetInput): Promise<ResetResult> {
  // 1. Authenticate
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 2. Validate input
  const parsed = resetInputSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const { eventDescription, emotionalState, confidenceScore } = parsed.data;

  // 3. Safety scan
  const safety = scanForCrisis([eventDescription, emotionalState]);

  if (safety.flagged) {
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.RESET,
        inputJson: { eventDescription, emotionalState, confidenceScore },
        outputJson: Prisma.JsonNull,
        flagged: true,
        reason: safety.reason,
      },
    });

    return { success: false, flagged: true, escalation: ESCALATION_MESSAGE };
  }

  // 4. Build prompt (with profile context)
  const prompt = buildResetPrompt({
    eventDescription,
    emotionalState,
    confidenceScore,
    profile: user.profile
      ? {
          role: user.profile.role,
          strengths: user.profile.strengths,
        }
      : null,
  });

  // 5. Call AI
  let rawResponse: string;
  try {
    rawResponse = await generateCoaching(prompt);
  } catch (e) {
    return {
      success: false,
      error: `AI service error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // 6. Parse + Zod validate
  const aiResult = parseAiResponse(rawResponse, resetResponseSchema);

  if (!aiResult.success) {
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.RESET,
        inputJson: { eventDescription, emotionalState, confidenceScore },
        outputJson: { raw: rawResponse },
        flagged: false,
        reason: `AI output validation failed: ${aiResult.error}`,
      },
    });
    return { success: false, error: "AI returned an unexpected response format. Please try again." };
  }

  const aiData = aiResult.data;

  // 7. Persist CoachingSession + LedgerEntry
  await db.coachingSession.create({
    data: {
      userId: user.id,
      mode: COACHING_MODES.RESET,
      inputJson: { eventDescription, emotionalState, confidenceScore },
      outputJson: aiData,
      flagged: false,
    },
  });

  await db.ledgerEntry.create({
    data: {
      userId: user.id,
      type: LEDGER_TYPES.DEPOSIT,
      title: "Reset Recovery",
      description: `Reset after: ${eventDescription.slice(0, 80)}`,
      scoreDelta: 2,
      sourceType: LEDGER_SOURCE_TYPES.RESET,
    },
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
