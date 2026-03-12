import Anthropic from "@anthropic-ai/sdk";

type GenerateCoachingArgs = {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
};

export type CoachingRequest = GenerateCoachingArgs;

const apiKey = process.env.ANTHROPIC_API_KEY;

const anthropic = apiKey
  ? new Anthropic({ apiKey })
  : null;

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
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured. Add a valid key to .env.local.");
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
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

export async function generateCoaching(args: GenerateCoachingArgs): Promise<string> {
  const attempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await callAnthropicOnce(args);
    } catch (error) {
      lastError = error;

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