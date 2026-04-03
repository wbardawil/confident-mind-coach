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

  it("accepts scoreDelta of 0 for low-quality input", () => {
    const result = espResponseSchema.safeParse({
      reflection: "R",
      affirmation: "A",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 0 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative scoreDelta", () => {
    const result = espResponseSchema.safeParse({
      reflection: "R",
      affirmation: "A",
      ledgerImpact: { title: "T", description: "D", scoreDelta: -1 },
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
  it("accepts valid response with ledgerImpact", () => {
    const result = pregameResponseSchema.safeParse({
      takeStock: "You have strong skills.",
      situationAssessment: "This is a normal challenge.",
      enoughStatement: "I am enough for this moment.",
      visualizationPrompt: "Picture yourself succeeding.",
      ledgerImpact: { title: "Pregame Prep", description: "Solid preparation", scoreDelta: 2 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts scoreDelta of 0 for low-quality input", () => {
    const result = pregameResponseSchema.safeParse({
      takeStock: "T",
      situationAssessment: "S",
      enoughStatement: "E",
      visualizationPrompt: "V",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 0 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects scoreDelta above 3", () => {
    const result = pregameResponseSchema.safeParse({
      takeStock: "T",
      situationAssessment: "S",
      enoughStatement: "E",
      visualizationPrompt: "V",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 4 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing ledgerImpact", () => {
    const result = pregameResponseSchema.safeParse({
      takeStock: "Stock",
      situationAssessment: "Assessment",
      enoughStatement: "Enough",
      visualizationPrompt: "Visualize",
    });
    expect(result.success).toBe(false);
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
      ledgerImpact: { title: "T", description: "D", scoreDelta: 1 },
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
      withdrawalImpact: {
        title: "Lost client",
        description: "Major client walked away",
        scoreDelta: -3,
      },
      recoveryImpact: {
        title: "Faced it head-on",
        description: "Processed the setback constructively",
        scoreDelta: 2,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty fields", () => {
    const result = resetResponseSchema.safeParse({
      acknowledgement: "",
      safeguard: "S",
      nextActionCue: "N",
      withdrawalImpact: { title: "T", description: "D", scoreDelta: -1 },
      recoveryImpact: { title: "T", description: "D", scoreDelta: 1 },
    });
    expect(result.success).toBe(false);
  });
});

describe("aarResponseSchema", () => {
  it("accepts valid response with ledgerImpact", () => {
    const result = aarResponseSchema.safeParse({
      lessonsLearned: "Preparation matters more than natural ability.",
      improvementPlan: "Create a checklist before each meeting.",
      ledgerImpact: { title: "Deep review", description: "Thorough debrief", scoreDelta: 2 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts scoreDelta of 0 for low-quality input", () => {
    const result = aarResponseSchema.safeParse({
      lessonsLearned: "L",
      improvementPlan: "P",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 0 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects scoreDelta above 3", () => {
    const result = aarResponseSchema.safeParse({
      lessonsLearned: "L",
      improvementPlan: "P",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 4 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing ledgerImpact", () => {
    const result = aarResponseSchema.safeParse({
      lessonsLearned: "L",
      improvementPlan: "P",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty lessonsLearned", () => {
    const result = aarResponseSchema.safeParse({
      lessonsLearned: "",
      improvementPlan: "Plan",
      ledgerImpact: { title: "T", description: "D", scoreDelta: 1 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(aarResponseSchema.safeParse({}).success).toBe(false);
    expect(aarResponseSchema.safeParse({ lessonsLearned: "L" }).success).toBe(false);
  });
});
