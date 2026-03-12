"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { scanForCrisis } from "@/lib/safety/crisis-detect";
import { ESCALATION_MESSAGE } from "@/lib/safety/escalation";
import { buildPregamePrompt } from "@/lib/coaching/pregame";
import { generateCoaching } from "@/lib/ai/client";
import { pregameResponseSchema, type PregameResponse } from "@/lib/ai/schemas";
import { parseAiResponse } from "@/lib/ai/parse";
import { pregameInputSchema, type PregameInput } from "@/lib/validators/pregame";
import { COACHING_MODES, LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";
import { friendlyAiError } from "@/lib/utils/errors";
import { coerceToNumber } from "@/lib/utils/coerce";

// ─── Return types ──────────────────────────────

interface PregameSuccessResult {
  success: true;
  data: PregameResponse;
}

interface PregameFlaggedResult {
  success: false;
  flagged: true;
  escalation: typeof ESCALATION_MESSAGE;
}

interface PregameErrorResult {
  success: false;
  flagged?: false;
  error: string;
}

export type PregameResult = PregameSuccessResult | PregameFlaggedResult | PregameErrorResult;

// ─── Main action ───────────────────────────────

export async function submitPregame(data: PregameInput): Promise<PregameResult> {
  // 1. Authenticate
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 2. Validate input (safely coerce confidenceLevel in case it arrives as
  //    string from the Server Action serialization boundary — Number("") and
  //    Number("   ") silently return 0, so we use a safe coercion helper)
  const coerced = {
    ...data,
    confidenceLevel: coerceToNumber(data.confidenceLevel),
  };
  const parsed = pregameInputSchema.safeParse(coerced);
  if (!parsed.success) return { success: false, error: "Validation failed" };

  const { upcomingEvent, confidenceLevel, fear, definitionOfSuccess } = parsed.data;

  // 3. Safety scan
  const safety = scanForCrisis([upcomingEvent, fear, definitionOfSuccess]);

  if (safety.flagged) {
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.PREGAME,
        inputJson: { upcomingEvent, confidenceLevel, fear, definitionOfSuccess },
        outputJson: Prisma.JsonNull,
        flagged: true,
        reason: safety.reason,
      },
    });

    return { success: false, flagged: true, escalation: ESCALATION_MESSAGE };
  }

  // 4. Build prompt (with profile context)
  const prompt = buildPregamePrompt({
    upcomingEvent,
    confidenceLevel,
    fear,
    definitionOfSuccess,
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
  const aiResult = parseAiResponse(rawResponse, pregameResponseSchema);

  if (!aiResult.success) {
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: COACHING_MODES.PREGAME,
        inputJson: { upcomingEvent, confidenceLevel, fear, definitionOfSuccess },
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
      mode: COACHING_MODES.PREGAME,
      inputJson: { upcomingEvent, confidenceLevel, fear, definitionOfSuccess },
      outputJson: aiData,
      flagged: false,
    },
  });

  await db.ledgerEntry.create({
    data: {
      userId: user.id,
      type: LEDGER_TYPES.DEPOSIT,
      title: "Pregame Preparation",
      description: `Prepared for: ${upcomingEvent}`,
      scoreDelta: 2,
      sourceType: LEDGER_SOURCE_TYPES.PREGAME,
    },
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
