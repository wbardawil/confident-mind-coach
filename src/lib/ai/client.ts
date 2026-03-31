import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

type GenerateCoachingArgs = {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
};

export type CoachingRequest = GenerateCoachingArgs;

/** Request timeout in milliseconds. */
const REQUEST_TIMEOUT_MS = 30_000;

/** Model used for structured JSON flows (ESP, Pregame, Reset, AAR). */
const STRUCTURED_MODEL = "claude-haiku-4-5-20251001";

/**
 * Model ID candidates for each tier, tried in order.
 * First one that works wins. Covers naming across API versions.
 * Can be overridden with env vars: COACH_MODEL_HAIKU, COACH_MODEL_SONNET, COACH_MODEL_OPUS
 */
const MODEL_CANDIDATES: Record<string, string[]> = {
  haiku: [
    "claude-haiku-4-5-20251001",
  ],
  sonnet: [
    "claude-sonnet-4-20250514",
    "claude-sonnet-4-5-20241022",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-latest",
  ],
  opus: [
    "claude-opus-4-20250514",
    "claude-3-opus-20240229",
    "claude-3-opus-latest",
  ],
};

/** Cache of verified working model IDs so we only probe once. */
const _verifiedModels: Record<string, string> = {};

/**
 * Resolve the user's model preference to a working Anthropic model ID.
 * On first call for each tier, probes candidates to find one that works.
 * Falls back to Haiku if nothing else works.
 */
export async function resolveCoachModel(preference?: string | null): Promise<string> {
  const tier = preference ?? "haiku";

  // Check env var override first
  const envOverride = process.env[`COACH_MODEL_${tier.toUpperCase()}`];
  if (envOverride) return envOverride;

  // Return cached result if we already found a working model
  if (_verifiedModels[tier]) return _verifiedModels[tier];

  // Haiku is known to work — skip probing
  if (tier === "haiku") {
    _verifiedModels[tier] = MODEL_CANDIDATES.haiku[0];
    return _verifiedModels[tier];
  }

  // Probe candidates with a minimal API call
  const candidates = MODEL_CANDIDATES[tier] ?? MODEL_CANDIDATES.haiku;
  const client = getClient();

  for (const modelId of candidates) {
    try {
      await client.messages.create({
        model: modelId,
        max_tokens: 5,
        messages: [{ role: "user", content: "hi" }],
      });
      // It worked — cache and return
      _verifiedModels[tier] = modelId;
      console.log(`[ai-client] Verified model for ${tier}: ${modelId}`);
      return modelId;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("not_found") || msg.includes("404")) {
        console.log(`[ai-client] Model ${modelId} not available, trying next...`);
        continue;
      }
      // Non-404 error (rate limit, auth, etc.) — model probably exists, just errored
      _verifiedModels[tier] = modelId;
      return modelId;
    }
  }

  // Nothing worked — fall back to Haiku
  console.warn(`[ai-client] No ${tier} model available, falling back to Haiku`);
  _verifiedModels[tier] = MODEL_CANDIDATES.haiku[0];
  return _verifiedModels[tier];
}

/** Synchronous version for cases where we already resolved. Returns cached or Haiku default. */
export function resolveCoachModelSync(preference?: string | null): string {
  const tier = preference ?? "haiku";
  const envOverride = process.env[`COACH_MODEL_${tier.toUpperCase()}`];
  if (envOverride) return envOverride;
  return _verifiedModels[tier] ?? MODEL_CANDIDATES.haiku[0];
}

/** Get the display label for a resolved model ID. */
export function getModelLabel(modelId: string): string {
  if (modelId.includes("opus")) return "Opus";
  if (modelId.includes("sonnet")) return "Sonnet";
  return "Haiku";
}

let _anthropic: Anthropic | null = null;

/**
 * Read the API key from .env / .env.local files directly.
 * This avoids Next.js webpack inlining process.env at compile time.
 */
function loadApiKey(): string | undefined {
  // First try process.env (works in production / Server Actions)
  const envKey = process.env["ANTHROPIC_API_KEY"];
  if (envKey) return envKey;

  // Fallback: read from .env files directly (Route Handler workaround)
  for (const file of [".env.local", ".env"]) {
    try {
      const content = readFileSync(join(process.cwd(), file), "utf-8");
      const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
      if (match?.[1]) return match[1].trim();
    } catch {
      // file doesn't exist, try next
    }
  }
  return undefined;
}

function getClient(): Anthropic {
  if (_anthropic) return _anthropic;
  const apiKey = loadApiKey();
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
    );
  }
  _anthropic = new Anthropic({ apiKey, timeout: REQUEST_TIMEOUT_MS });
  return _anthropic;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractTextFromResponse(response: Anthropic.Messages.Message): string {
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Anthropic returned no text content.");
  }

  return text;
}

async function callAnthropicOnce({
  systemPrompt,
  userMessage,
  maxTokens = 500,
  temperature = 0.4,
}: GenerateCoachingArgs): Promise<string> {
  const client = getClient();

  const response = await client.messages.create({
    model: STRUCTURED_MODEL,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  return extractTextFromResponse(response);
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return (
    message.includes("rate limit") ||
    message.includes("overloaded") ||
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("temporarily unavailable") ||
    message.includes("502") ||
    message.includes("503") ||
    message.includes("504")
  );
}

/**
 * Structured diagnostic log for AI call failures.
 * Includes enough detail for debugging without leaking user content.
 */
function logAiError(error: unknown, attempt: number, maxAttempts: number): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.name : "Unknown";
  const retryable = isRetryableError(error);

  console.error(
    JSON.stringify({
      level: "error",
      service: "ai-client",
      event: "coaching_call_failed",
      attempt,
      maxAttempts,
      retryable,
      errorName,
      errorMessage,
      timestamp: new Date().toISOString(),
    }),
  );
}

type StreamCoachingArgs = {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  /** Anthropic model ID to use. Defaults to Haiku. */
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

/**
 * Stream a multi-turn coaching conversation.
 * Returns the Anthropic MessageStream — caller consumes text deltas.
 */
export function streamCoaching({
  systemPrompt,
  messages,
  model,
  maxTokens = 1024,
  temperature = 0.6,
}: StreamCoachingArgs) {
  const client = getClient();

  return client.messages.stream({
    model: model ?? MODEL_CANDIDATES.haiku[0],
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages,
  });
}

export async function generateCoaching(args: GenerateCoachingArgs): Promise<string> {
  const attempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await callAnthropicOnce(args);
    } catch (error) {
      lastError = error;
      logAiError(error, attempt, attempts);

      if (attempt === attempts || !isRetryableError(error)) {
        throw error;
      }

      await sleep(400 * attempt);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unknown AI client error.");
}
