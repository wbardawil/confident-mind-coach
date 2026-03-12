import { describe, it, expect } from "vitest";
import { aarInputSchema } from "@/lib/validators/aar";

describe("aarInputSchema", () => {
  it("accepts valid input", () => {
    const result = aarInputSchema.safeParse({
      whatHappened: "Gave a presentation to leadership",
      soWhat: "I learned that I need to prepare more examples",
      nowWhat: "Create an example bank before my next talk",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty whatHappened", () => {
    const result = aarInputSchema.safeParse({
      whatHappened: "",
      soWhat: "Matters a lot",
      nowWhat: "Will improve",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty soWhat", () => {
    const result = aarInputSchema.safeParse({
      whatHappened: "Something happened",
      soWhat: "",
      nowWhat: "Will improve",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty nowWhat", () => {
    const result = aarInputSchema.safeParse({
      whatHappened: "Something happened",
      soWhat: "Matters a lot",
      nowWhat: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(aarInputSchema.safeParse({}).success).toBe(false);
    expect(aarInputSchema.safeParse({ whatHappened: "x" }).success).toBe(false);
  });

  it("rejects non-string types", () => {
    const result = aarInputSchema.safeParse({
      whatHappened: 42,
      soWhat: true,
      nowWhat: null,
    });
    expect(result.success).toBe(false);
  });
});
