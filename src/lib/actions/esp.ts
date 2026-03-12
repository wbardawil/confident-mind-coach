"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { scanForCrisis } from "@/lib/safety/crisis-detect";
import { ESCALATION_MESSAGE } from "@/lib/safety/escalation";
import { buildEspPrompt } from "@/lib/coaching/esp";
import { generateCoaching } from "@/lib/ai/client";
import { espResponseSchema, type EspResponse } from "@/lib/ai/schemas";
import { parseAiResponse } from "@/lib/ai/parse";
import { espInputSchema, type EspInput } from "@/lib/validators/esp";
import { COACHING_MODES, LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";
import { friendlyAiError } from "@/lib/utils/errors";

// ─── Return types ──────────────────────────────

interface EspSuccessResult {
  success: true;
  data: {
    reflection: string;
    affirmation: string;
    ledgerImpact: EspResponse["ledgerImpact"];
  };
}

interface EspFlaggedResult {
  success: false;
  flagged: true;
  escalation: typeof ESCALATION_MESSAGE;
}

interface EspErrorResult {
  success: false;
  flagged?: false;
  error: string;
}

export type EspResult = EspSuccessResult | EspFlaggedResult | EspErrorResult;

// ─── Main action ───────────────────────────────

export async function submitEsp(data: EspInput): Promise<EspResult> {
  // 1. Authenticate
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 2. Validate input
  const parsed = espInputSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const { effort, success, progress } = parsed.data;

  // 3. Safety scan
  const safety = scanForCrisis([effort, success, progress]);

  if (safety.flagged) {
    // Persist flagged session for audit
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.ESP,
        inputJson: { effort, success, progress },
        outputJson: Prisma.JsonNull,
        flagged: true,
        reason: safety.reason,
      },
    });

    return { success: false, flagged: true, escalation: ESCALATION_MESSAGE };
  }

  // 4. Build prompt (with profile context)
  const prompt = buildEspPrompt({
    effort,
    success,
    progress,
    profile: user.profile
      ? {
          role: user.profile.role,
          performanceDomain: user.profile.performanceDomain,
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
  const aiResult = parseAiResponse(rawResponse, espResponseSchema);

  if (!aiResult.success) {
    // Store the failed attempt for debugging
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.ESP,
        inputJson: { effort, success, progress },
        outputJson: { raw: rawResponse },
        flagged: false,
        reason: `AI output validation failed: ${aiResult.error}`,
      },
    });
    return { success: false, error: "AI returned an unexpected response format. Please try again." };
  }

  const aiData = aiResult.data;

  // 7. Persist everything in a single logical transaction
  const espEntry = await db.eSPEntry.create({
    data: {
      userId: user.id,
      effort,
      success,
      progress,
    },
  });

  await db.coachingSession.create({
    data: {
      userId: user.id,
      mode: COACHING_MODES.ESP,
      inputJson: { effort, success, progress },
      outputJson: aiData,
      flagged: false,
    },
  });

  await db.affirmation.create({
    data: {
      userId: user.id,
      text: aiData.affirmation,
      source: COACHING_MODES.ESP,
      sourceId: espEntry.id,
    },
  });

  await db.ledgerEntry.create({
    data: {
      userId: user.id,
      type: LEDGER_TYPES.DEPOSIT,
      title: aiData.ledgerImpact.title,
      description: aiData.ledgerImpact.description,
      scoreDelta: aiData.ledgerImpact.scoreDelta,
      sourceId: espEntry.id,
      sourceType: LEDGER_SOURCE_TYPES.ESP,
    },
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
