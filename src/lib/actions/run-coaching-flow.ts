import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { scanForCrisis } from "@/lib/safety/crisis-detect";
import { getSessionLimit } from "@/lib/stripe/config";
import { startOfUserDay } from "@/lib/utils/date";
import { ESCALATION_MESSAGE } from "@/lib/safety/escalation";
import { generateCoaching, type CoachingRequest } from "@/lib/ai/client";
import { parseAiResponse } from "@/lib/ai/parse";
import { friendlyAiError } from "@/lib/utils/errors";
import { logUsage } from "@/lib/ai/usage-logger";
import { getPersonalityContext } from "@/lib/coaching/personality";
import { getVisionContext } from "@/lib/coaching/vision";
import { getSystemsContext } from "@/lib/coaching/systems";

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
  buildPrompt: (input: TInput, user: CurrentUser) => CoachingRequest | Promise<CoachingRequest>;
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

  // 1b. Free tier rate limit (3 sessions/day)
  const bypass = true; // TODO: revert to process.env.BYPASS_SUBSCRIPTION_GATE === "true" when Stripe is live
  const tier = bypass ? "elite" : (user.subscriptionTier ?? "free");
  const limit = getSessionLimit(tier);
  if (limit !== Infinity) {
    const startOfDay = startOfUserDay(user.profile?.timezone ?? "UTC");
    const todayCount = await db.coachingSession.count({
      where: { userId: user.id, createdAt: { gte: startOfDay } },
    });
    if (todayCount >= limit) {
      return {
        ok: false,
        result: {
          success: false,
          error: `You've reached your daily limit of ${limit} coaching sessions. Upgrade to Pro for unlimited access.`,
        },
      };
    }
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
  const prompt = await config.buildPrompt(input, user);

  // Inject language preference into the system prompt
  const language = user.profile?.language;
  if (language && language !== "English") {
    prompt.systemPrompt += `\n\nIMPORTANT: Respond entirely in ${language}. All coaching text, affirmations, and feedback must be in ${language}.`;
  }

  // Inject structured personality context into the system prompt
  const personalityContext = await getPersonalityContext(user.id);
  if (personalityContext) {
    prompt.systemPrompt += `\n\n${personalityContext}`;
  }

  // Inject 10x vision context into the system prompt
  const visionContext = await getVisionContext(user.id);
  if (visionContext) {
    prompt.systemPrompt += `\n\n${visionContext}`;
  }

  // Inject active systems context into the system prompt
  const systemsContext = await getSystemsContext(user.id);
  if (systemsContext) {
    prompt.systemPrompt += `\n\n${systemsContext}`;
  }

  let rawResponse: string;
  const startTime = Date.now();
  try {
    const aiResponse = await generateCoaching(prompt);
    rawResponse = aiResponse.text;

    // Fire-and-forget usage log
    logUsage({
      userId: user.id,
      feature: config.mode.toLowerCase(),
      model: aiResponse.usage.model,
      inputTokens: aiResponse.usage.inputTokens,
      outputTokens: aiResponse.usage.outputTokens,
      cacheReadTokens: aiResponse.usage.cacheReadTokens,
      cacheWriteTokens: aiResponse.usage.cacheWriteTokens,
      latencyMs: Date.now() - startTime,
    });
  } catch (e) {
    return {
      ok: false,
      result: { success: false, error: friendlyAiError(e) },
    };
  }

  // 6. Parse + Zod validate AI output
  let aiResult = parseAiResponse(rawResponse, config.responseSchema);

  // 6b. Retry once on parse failure with error context
  if (!aiResult.success) {
    try {
      const retryStartTime = Date.now();
      const retryPrompt = {
        ...prompt,
        userMessage: `${prompt.userMessage}\n\nIMPORTANT: Your previous response failed validation: ${aiResult.error}. Please return valid JSON matching the required schema.`,
      };
      const retryResponse = await generateCoaching(retryPrompt);
      rawResponse = retryResponse.text;

      logUsage({
        userId: user.id,
        feature: config.mode.toLowerCase(),
        model: retryResponse.usage.model,
        inputTokens: retryResponse.usage.inputTokens,
        outputTokens: retryResponse.usage.outputTokens,
        cacheReadTokens: retryResponse.usage.cacheReadTokens,
        cacheWriteTokens: retryResponse.usage.cacheWriteTokens,
        latencyMs: Date.now() - retryStartTime,
        errorType: "parse_retry",
      });

      aiResult = parseAiResponse(rawResponse, config.responseSchema);
    } catch {
      // Retry failed — fall through to the original error handling
    }
  }

  if (!aiResult.success) {
    // Log parse failure
    logUsage({
      userId: user.id,
      feature: config.mode.toLowerCase(),
      model: "unknown",
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startTime,
      success: false,
      errorType: "parse_failure",
    });

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
