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

/** Direct map from user setting to exact Anthropic model ID. */
const COACH_MODELS: Record<string, string> = {
  "haiku-4.5": "claude-haiku-4-5-20251001",
  "sonnet-3.5": "claude-3-5-sonnet-20241022",
  "sonnet-4": "claude-sonnet-4-20250514",
  "opus-3": "claude-opus-4-20250514",
};

const DEFAULT_MODEL = "haiku-4.5";

/** Resolve the user's model preference to an Anthropic model ID. */
export async function resolveCoachModel(preference?: string | null): Promise<string> {
  return COACH_MODELS[preference ?? DEFAULT_MODEL] ?? COACH_MODELS[DEFAULT_MODEL];
}

/** Display labels for each model option. */
const MODEL_LABELS: Record<string, string> = {
  "haiku-4.5": "Haiku 4.5",
  "sonnet-3.5": "Sonnet 3.5",
  "sonnet-4": "Sonnet 4",
  "opus-3": "Opus 4",
};

/** Get the display label for a model preference key. */
export function getModelLabel(preference?: string | null): string {
  return MODEL_LABELS[preference ?? DEFAULT_MODEL] ?? preference ?? "Haiku 4.5";
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
    system: [
      {
        type: "text" as const,
        text: systemPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
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
  maxTokens = 600,
  temperature = 0.6,
}: StreamCoachingArgs) {
  const client = getClient();

  return client.messages.stream({
    model: model ?? COACH_MODELS[DEFAULT_MODEL],
    max_tokens: maxTokens,
    temperature,
    system: [
      {
        type: "text" as const,
        text: systemPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
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
