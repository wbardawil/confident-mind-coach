import { describe, it, expect } from "vitest";
import { resetInputSchema } from "@/lib/validators/reset";
import { coerceToNumber } from "@/lib/utils/coerce";

describe("resetInputSchema", () => {
  it("accepts valid input", () => {
    const result = resetInputSchema.safeParse({
      eventDescription: "Failed the presentation",
      emotionalState: "Frustrated and disappointed",
      confidenceScore: 3,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty eventDescription", () => {
    const result = resetInputSchema.safeParse({
      eventDescription: "",
      emotionalState: "Sad",
      confidenceScore: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty emotionalState", () => {
    const result = resetInputSchema.safeParse({
      eventDescription: "Something happened",
      emotionalState: "",
      confidenceScore: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects confidence below 1", () => {
    const result = resetInputSchema.safeParse({
      eventDescription: "Event",
      emotionalState: "Feeling bad",
      confidenceScore: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects confidence above 10", () => {
    const result = resetInputSchema.safeParse({
      eventDescription: "Event",
      emotionalState: "Feeling bad",
      confidenceScore: 11,
    });
    expect(result.success).toBe(false);
  });

  it("accepts boundary values 1 and 10", () => {
    expect(
      resetInputSchema.safeParse({
        eventDescription: "E",
        emotionalState: "F",
        confidenceScore: 1,
      }).success
    ).toBe(true);

    expect(
      resetInputSchema.safeParse({
        eventDescription: "E",
        emotionalState: "F",
        confidenceScore: 10,
      }).success
    ).toBe(true);
  });
});

// ─── Coercion → Validation pipeline ────────────
// These simulate the server action pipeline: coerceToNumber() → Zod safeParse.
// The key guarantee: empty strings and whitespace never silently become 0.

describe("resetInputSchema coercion edge cases (coerceToNumber → Zod)", () => {
  const validBase = {
    eventDescription: "Event",
    emotionalState: "Feeling bad",
  };

  it("coerced empty string → undefined → Zod rejects (not 0)", () => {
    const coerced = coerceToNumber("");
    expect(coerced).toBeUndefined();

    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: coerced,
    });
    expect(result.success).toBe(false);
  });

  it("coerced whitespace string → undefined → Zod rejects (not 0)", () => {
    const coerced = coerceToNumber("   ");
    expect(coerced).toBeUndefined();

    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: coerced,
    });
    expect(result.success).toBe(false);
  });

  it("coerced 'abc' → undefined → Zod rejects", () => {
    const coerced = coerceToNumber("abc");
    expect(coerced).toBeUndefined();

    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: coerced,
    });
    expect(result.success).toBe(false);
  });

  it("coerced NaN → undefined → Zod rejects", () => {
    const coerced = coerceToNumber(NaN);
    expect(coerced).toBeUndefined();

    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: coerced,
    });
    expect(result.success).toBe(false);
  });

  it("coerced null → undefined → Zod rejects", () => {
    const coerced = coerceToNumber(null);
    expect(coerced).toBeUndefined();

    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: coerced,
    });
    expect(result.success).toBe(false);
  });

  it("coerced '5' → 5 → Zod accepts", () => {
    const coerced = coerceToNumber("5");
    expect(coerced).toBe(5);

    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: coerced,
    });
    expect(result.success).toBe(true);
  });

  it("coerced '1' → 1 → Zod accepts (boundary)", () => {
    const coerced = coerceToNumber("1");
    expect(coerced).toBe(1);

    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: coerced,
    });
    expect(result.success).toBe(true);
  });

  it("Zod rejects raw string '5' without coercion", () => {
    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: "5",
    });
    expect(result.success).toBe(false);
  });

  it("Zod rejects float 5.5 (requires int)", () => {
    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: 5.5,
    });
    expect(result.success).toBe(false);
  });

  it("Zod rejects Infinity", () => {
    const result = resetInputSchema.safeParse({
      ...validBase,
      confidenceScore: Infinity,
    });
    expect(result.success).toBe(false);
  });
});
