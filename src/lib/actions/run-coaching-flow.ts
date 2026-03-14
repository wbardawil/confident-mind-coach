import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { scanForCrisis } from "@/lib/safety/crisis-detect";
import { ESCALATION_MESSAGE } from "@/lib/safety/escalation";
import { generateCoaching, type CoachingRequest } from "@/lib/ai/client";
import { parseAiResponse } from "@/lib/ai/parse";
import { friendlyAiError } from "@/lib/utils/errors";

// ─── Shared result types ──────────────────────

export interface CoachingFlaggedResult {
  success: false;
  flagged: true;
  escalation: typeof ESCALATION_MESSAGE;
}

export interface CoachingErrorResult {
  success: false;
  flagged?: false;
  error: string;
}

// ─── User type (inferred from getCurrentUser) ─

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// ─── Flow config ──────────────────────────────

export interface CoachingFlowConfig<TInput, TOutput> {
  /** Coaching mode constant (e.g. COACHING_MODES.PREGAME) */
  mode: string;
  /** Zod schema for validating the raw input */
  inputSchema: z.ZodType<TInput>;
  /** Zod schema for validating the AI response */
  responseSchema: z.ZodType<TOutput>;
  /** Optional input coercion before Zod validation */
  coerce?: (raw: TInput) => unknown;
  /** Extract the string fields that should be scanned for crisis content */
  safetyFields: (input: TInput) => string[];
  /** Build the AI prompt from validated input and user profile */
  buildPrompt: (input: TInput, user: CurrentUser) => CoachingRequest;
}

// ─── Flow result ──────────────────────────────

export interface CoachingFlowOk<TInput, TOutput> {
  ok: true;
  user: CurrentUser;
  input: TInput;
  aiData: TOutput;
}

interface CoachingFlowTerminal {
  ok: false;
  result: CoachingFlaggedResult | CoachingErrorResult;
}

export type CoachingFlowOutcome<TInput, TOutput> =
  | CoachingFlowOk<TInput, TOutput>
  | CoachingFlowTerminal;

// ─── Pipeline ─────────────────────────────────

/**
 * Shared coaching flow pipeline: auth → validate → safety → AI → parse.
 *
 * Returns either:
 *   - `{ ok: true, user, input, aiData }` — caller handles persistence
 *   - `{ ok: false, result }` — caller returns `result` directly
 *
 * Error-path writes (flagged sessions, parse failures) are handled here.
 * Success-path persistence is intentionally left to the caller because
 * each flow has different write requirements.
 */
export async function runCoachingFlow<TInput, TOutput>(
  rawData: TInput,
  config: CoachingFlowConfig<TInput, TOutput>,
): Promise<CoachingFlowOutcome<TInput, TOutput>> {
  // 1. Authenticate
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, result: { success: false, error: "Not authenticated" } };
  }

  // 2. Validate input
  const toValidate = config.coerce ? config.coerce(rawData) : rawData;
  const parsed = config.inputSchema.safeParse(toValidate);
  if (!parsed.success) {
    return {
      ok: false,
      result: { success: false, error: "Please check your inputs and try again." },
    };
  }
  const input = parsed.data;

  // 3. Safety scan
  const safety = scanForCrisis(config.safetyFields(input));

  if (safety.flagged) {
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: config.mode,
        inputJson: input as unknown as Prisma.InputJsonValue,
        outputJson: Prisma.JsonNull,
        flagged: true,
        reason: safety.reason,
      },
    });

    return {
      ok: false,
      result: { success: false, flagged: true, escalation: ESCALATION_MESSAGE },
    };
  }

  // 4. Build prompt + 5. Call AI
  const prompt = config.buildPrompt(input, user);

  let rawResponse: string;
  try {
    rawResponse = await generateCoaching(prompt);
  } catch (e) {
    return {
      ok: false,
      result: { success: false, error: friendlyAiError(e) },
    };
  }

  // 6. Parse + Zod validate AI output
  const aiResult = parseAiResponse(rawResponse, config.responseSchema);

  if (!aiResult.success) {
    await db.coachingSession.create({
      data: {
        userId: user.id,
        mode: config.mode,
        inputJson: input as unknown as Prisma.InputJsonValue,
        outputJson: { raw: rawResponse },
        flagged: false,
        reason: `AI output validation failed: ${aiResult.error}`,
      },
    });

    return {
      ok: false,
      result: {
        success: false,
        error: "AI returned an unexpected response format. Please try again.",
      },
    };
  }

  return { ok: true, user, input, aiData: aiResult.data };
}
