"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { scanForCrisis } from "@/lib/safety/crisis-detect";
import { ESCALATION_MESSAGE } from "@/lib/safety/escalation";
import { buildAarPrompt } from "@/lib/coaching/aar";
import { generateCoaching } from "@/lib/ai/client";
import { aarResponseSchema, type AarResponse } from "@/lib/ai/schemas";
import { parseAiResponse } from "@/lib/ai/parse";
import { aarInputSchema, type AarInput } from "@/lib/validators/aar";
import { COACHING_MODES, LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";
import { friendlyAiError } from "@/lib/utils/errors";

// ─── Return types ──────────────────────────────

interface AarSuccessResult {
  success: true;
  data: AarResponse;
}

interface AarFlaggedResult {
  success: false;
  flagged: true;
  escalation: typeof ESCALATION_MESSAGE;
}

interface AarErrorResult {
  success: false;
  flagged?: false;
  error: string;
}

export type AarResult = AarSuccessResult | AarFlaggedResult | AarErrorResult;

// ─── Main action ───────────────────────────────

export async function submitAar(data: AarInput): Promise<AarResult> {
  // 1. Authenticate
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 2. Validate input
  const parsed = aarInputSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const { whatHappened, soWhat, nowWhat } = parsed.data;

  // 3. Safety scan
  const safety = scanForCrisis([whatHappened, soWhat, nowWhat]);

  if (safety.flagged) {
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.AAR,
        inputJson: { whatHappened, soWhat, nowWhat },
        outputJson: Prisma.JsonNull,
        flagged: true,
        reason: safety.reason,
      },
    });

    return { success: false, flagged: true, escalation: ESCALATION_MESSAGE };
  }

  // 4. Build prompt (with profile context)
  const prompt = buildAarPrompt({
    whatHappened,
    soWhat,
    nowWhat,
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
      error: friendlyAiError(e),
    };
  }

  // 6. Parse + Zod validate
  const aiResult = parseAiResponse(rawResponse, aarResponseSchema);

  if (!aiResult.success) {
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.AAR,
        inputJson: { whatHappened, soWhat, nowWhat },
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
      mode: COACHING_MODES.AAR,
      inputJson: { whatHappened, soWhat, nowWhat },
      outputJson: aiData,
      flagged: false,
    },
  });

  await db.ledgerEntry.create({
    data: {
      userId: user.id,
      type: LEDGER_TYPES.DEPOSIT,
      title: "After Action Review",
      description: `Reviewed: ${whatHappened.slice(0, 80)}`,
      scoreDelta: 2,
      sourceType: LEDGER_SOURCE_TYPES.AAR,
    },
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
