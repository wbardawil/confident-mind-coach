import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseAiResponse } from "@/lib/ai/parse";

const testSchema = z.object({
  name: z.string().min(1),
  score: z.number().int().min(0),
});

describe("parseAiResponse", () => {
  it("parses valid JSON matching schema", () => {
    const result = parseAiResponse('{"name":"Alice","score":5}', testSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alice");
      expect(result.data.score).toBe(5);
    }
  });

  it("strips ```json code fences", () => {
    const raw = '```json\n{"name":"Bob","score":3}\n```';
    const result = parseAiResponse(raw, testSchema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Bob");
    }
  });

  it("strips plain ``` code fences", () => {
    const raw = '```\n{"name":"Charlie","score":1}\n```';
    const result = parseAiResponse(raw, testSchema);
    expect(result.success).toBe(true);
  });

  it("fails on invalid JSON", () => {
    const result = parseAiResponse("not valid json at all", testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Failed to parse AI response as JSON");
    }
  });

  it("fails when JSON does not match schema", () => {
    const result = parseAiResponse('{"name":"","score":-1}', testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Zod validation failed");
    }
  });

  it("fails when required field is missing", () => {
    const result = parseAiResponse('{"name":"Alice"}', testSchema);
    expect(result.success).toBe(false);
  });

  it("fails on empty string input", () => {
    const result = parseAiResponse("", testSchema);
    expect(result.success).toBe(false);
  });

  it("works with real espResponseSchema shape", () => {
    const espSchema = z.object({
      reflection: z.string().min(1),
      affirmation: z.string().min(1),
      ledgerImpact: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        scoreDelta: z.number().int().min(1).max(5),
      }),
    });

    const raw = JSON.stringify({
      reflection: "Great work today.",
      affirmation: "I am capable.",
      ledgerImpact: {
        title: "Daily Effort",
        description: "Showed up and did the work.",
        scoreDelta: 3,
      },
    });

    const result = parseAiResponse(raw, espSchema);
    expect(result.success).toBe(true);
  });

  it("rejects scoreDelta outside range", () => {
    const espSchema = z.object({
      reflection: z.string().min(1),
      affirmation: z.string().min(1),
      ledgerImpact: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        scoreDelta: z.number().int().min(1).max(5),
      }),
    });

    const raw = JSON.stringify({
      reflection: "Work",
      affirmation: "Good",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 10 },
    });

    const result = parseAiResponse(raw, espSchema);
    expect(result.success).toBe(false);
  });
});
