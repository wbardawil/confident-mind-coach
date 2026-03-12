import { describe, it, expect } from "vitest";
import { resetInputSchema } from "@/lib/validators/reset";

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
