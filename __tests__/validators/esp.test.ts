import { describe, it, expect } from "vitest";
import { espInputSchema } from "@/lib/validators/esp";

describe("espInputSchema", () => {
  it("accepts valid input", () => {
    const result = espInputSchema.safeParse({
      effort: "Worked on presentation",
      success: "Got positive feedback",
      progress: "Finished first draft",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty effort", () => {
    const result = espInputSchema.safeParse({
      effort: "",
      success: "Got positive feedback",
      progress: "Finished first draft",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty success", () => {
    const result = espInputSchema.safeParse({
      effort: "Worked hard",
      success: "",
      progress: "Finished first draft",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty progress", () => {
    const result = espInputSchema.safeParse({
      effort: "Worked hard",
      success: "Got positive feedback",
      progress: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields entirely", () => {
    const result = espInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-string types", () => {
    const result = espInputSchema.safeParse({
      effort: 123,
      success: true,
      progress: null,
    });
    expect(result.success).toBe(false);
  });
});
