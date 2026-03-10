import { z } from "zod";

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

/**
 * Parse raw AI text into a validated object using a Zod schema.
 *
 * The AI is instructed to return JSON. This function:
 *   1. Extracts JSON from the response (handles markdown code fences)
 *   2. Parses with JSON.parse
 *   3. Validates with the provided Zod schema
 */
export function parseAiResponse<T>(
  raw: string,
  schema: z.ZodType<T>
): { success: true; data: T } | { success: false; error: string } {
  const cleaned = stripCodeFences(raw);

  try {
    const parsed = JSON.parse(cleaned);
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      error: `Zod validation failed: ${JSON.stringify(result.error.issues)}. Raw response: ${cleaned}`,
    };
  } catch (e) {
    return {
      success: false,
      error: `Failed to parse AI response as JSON: ${e instanceof Error ? e.message : String(e)}. Raw response: ${cleaned}`,
    };
  }
}
