import { describe, it, expect } from "vitest";
import { pregameInputSchema } from "@/lib/validators/pregame";

describe("pregameInputSchema", () => {
  it("accepts valid input", () => {
    const result = pregameInputSchema.safeParse({
      upcomingEvent: "Board presentation",
      confidenceLevel: 7,
      fear: "Forgetting key points",
      definitionOfSuccess: "Clear delivery, engaged audience",
    });
    expect(result.success).toBe(true);
  });

  it("rejects confidence below 1", () => {
    const result = pregameInputSchema.safeParse({
      upcomingEvent: "Event",
      confidenceLevel: 0,
      fear: "Fear",
      definitionOfSuccess: "Success",
    });
    expect(result.success).toBe(false);
  });

  it("rejects confidence above 10", () => {
    const result = pregameInputSchema.safeParse({
      upcomingEvent: "Event",
      confidenceLevel: 11,
      fear: "Fear",
      definitionOfSuccess: "Success",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer confidence", () => {
    const result = pregameInputSchema.safeParse({
      upcomingEvent: "Event",
      confidenceLevel: 5.5,
      fear: "Fear",
      definitionOfSuccess: "Success",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty upcomingEvent", () => {
    const result = pregameInputSchema.safeParse({
      upcomingEvent: "",
      confidenceLevel: 5,
      fear: "Fear",
      definitionOfSuccess: "Success",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = pregameInputSchema.safeParse({
      upcomingEvent: "Event",
    });
    expect(result.success).toBe(false);
  });
});
