import { describe, it, expect } from "vitest";
import {
  espResponseSchema,
  pregameResponseSchema,
  resetResponseSchema,
  aarResponseSchema,
} from "@/lib/ai/schemas";

describe("espResponseSchema", () => {
  it("accepts valid response", () => {
    const result = espResponseSchema.safeParse({
      reflection: "Great effort today.",
      affirmation: "I am capable and growing.",
      ledgerImpact: { title: "Effort", description: "Did the work", scoreDelta: 3 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects scoreDelta of 0", () => {
    const result = espResponseSchema.safeParse({
      reflection: "R",
      affirmation: "A",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects scoreDelta of 6", () => {
    const result = espResponseSchema.safeParse({
      reflection: "R",
      affirmation: "A",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 6 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty reflection", () => {
    const result = espResponseSchema.safeParse({
      reflection: "",
      affirmation: "A",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 3 },
    });
    expect(result.success).toBe(false);
  });
});

describe("pregameResponseSchema", () => {
  it("accepts valid response", () => {
    const result = pregameResponseSchema.safeParse({
      takeStock: "You have strong skills.",
      situationAssessment: "This is a normal challenge.",
      enoughStatement: "I am enough for this moment.",
      visualizationPrompt: "Picture yourself succeeding.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = pregameResponseSchema.safeParse({
      takeStock: "Stock",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty strings", () => {
    const result = pregameResponseSchema.safeParse({
      takeStock: "",
      situationAssessment: "",
      enoughStatement: "",
      visualizationPrompt: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("resetResponseSchema", () => {
  it("accepts valid response", () => {
    const result = resetResponseSchema.safeParse({
      acknowledgement: "That sounds difficult.",
      safeguard: "Remember your strengths.",
      nextActionCue: "Take a five-minute walk.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty fields", () => {
    const result = resetResponseSchema.safeParse({
      acknowledgement: "",
      safeguard: "S",
      nextActionCue: "N",
    });
    expect(result.success).toBe(false);
  });
});

describe("aarResponseSchema", () => {
  it("accepts valid response", () => {
    const result = aarResponseSchema.safeParse({
      lessonsLearned: "Preparation matters more than natural ability.",
      improvementPlan: "Create a checklist before each meeting.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty lessonsLearned", () => {
    const result = aarResponseSchema.safeParse({
      lessonsLearned: "",
      improvementPlan: "Plan",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(aarResponseSchema.safeParse({}).success).toBe(false);
    expect(aarResponseSchema.safeParse({ lessonsLearned: "L" }).success).toBe(false);
  });
});
