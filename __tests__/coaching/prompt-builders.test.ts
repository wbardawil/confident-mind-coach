import { describe, it, expect } from "vitest";
import { buildEspPrompt } from "@/lib/coaching/esp";
import { buildPregamePrompt } from "@/lib/coaching/pregame";
import { buildResetPrompt } from "@/lib/coaching/reset";
import { buildAarPrompt } from "@/lib/coaching/aar";

describe("buildEspPrompt", () => {
  it("returns systemPrompt and userMessage", () => {
    const result = buildEspPrompt({
      effort: "Worked hard",
      success: "Got a win",
      progress: "Moving forward",
      profile: null,
    });
    expect(result.systemPrompt).toBeTruthy();
    expect(result.userMessage).toBeTruthy();
  });

  it("includes profile context when provided", () => {
    const result = buildEspPrompt({
      effort: "Effort",
      success: "Success",
      progress: "Progress",
      profile: {
        role: "Sales Manager",
        performanceDomain: "Enterprise Sales",
        strengths: ["communication", "persistence"],
      },
    });
    expect(result.systemPrompt).toContain("Sales Manager");
    expect(result.systemPrompt).toContain("Enterprise Sales");
    expect(result.systemPrompt).toContain("communication");
  });

  it("includes user input in userMessage", () => {
    const result = buildEspPrompt({
      effort: "Early morning training",
      success: "Hit my targets",
      progress: "Consistent routine",
      profile: null,
    });
    expect(result.userMessage).toContain("Early morning training");
    expect(result.userMessage).toContain("Hit my targets");
    expect(result.userMessage).toContain("Consistent routine");
  });

  it("instructs JSON-only output in system prompt", () => {
    const result = buildEspPrompt({
      effort: "E",
      success: "S",
      progress: "P",
      profile: null,
    });
    expect(result.systemPrompt).toContain("ONLY valid JSON");
    expect(result.systemPrompt).toContain("no markdown");
  });
});

describe("buildPregamePrompt", () => {
  it("returns systemPrompt and userMessage", () => {
    const result = buildPregamePrompt({
      upcomingEvent: "Presentation",
      confidenceLevel: 6,
      fear: "Forgetting points",
      definitionOfSuccess: "Clear delivery",
      profile: null,
    });
    expect(result.systemPrompt).toBeTruthy();
    expect(result.userMessage).toContain("Presentation");
    expect(result.userMessage).toContain("6/10");
  });

  it("includes profile strengths", () => {
    const result = buildPregamePrompt({
      upcomingEvent: "Event",
      confidenceLevel: 5,
      fear: "Fear",
      definitionOfSuccess: "Win",
      profile: { role: "Coach", strengths: ["leadership", "focus"] },
    });
    expect(result.systemPrompt).toContain("Coach");
    expect(result.systemPrompt).toContain("leadership");
  });

  it("instructs JSON-only output", () => {
    const result = buildPregamePrompt({
      upcomingEvent: "E",
      confidenceLevel: 5,
      fear: "F",
      definitionOfSuccess: "S",
      profile: null,
    });
    expect(result.systemPrompt).toContain("ONLY valid JSON");
    expect(result.systemPrompt).toContain("takeStock");
    expect(result.systemPrompt).toContain("enoughStatement");
  });
});

describe("buildResetPrompt", () => {
  it("returns systemPrompt and userMessage", () => {
    const result = buildResetPrompt({
      eventDescription: "Failed the meeting",
      emotionalState: "Frustrated",
      confidenceScore: 3,
      profile: null,
    });
    expect(result.systemPrompt).toBeTruthy();
    expect(result.userMessage).toContain("Failed the meeting");
    expect(result.userMessage).toContain("3/10");
  });

  it("includes profile context", () => {
    const result = buildResetPrompt({
      eventDescription: "Event",
      emotionalState: "State",
      confidenceScore: 5,
      profile: { role: "Engineer", strengths: ["problem-solving"] },
    });
    expect(result.systemPrompt).toContain("Engineer");
    expect(result.systemPrompt).toContain("problem-solving");
  });

  it("instructs JSON-only output with correct shape", () => {
    const result = buildResetPrompt({
      eventDescription: "E",
      emotionalState: "S",
      confidenceScore: 5,
      profile: null,
    });
    expect(result.systemPrompt).toContain("acknowledgement");
    expect(result.systemPrompt).toContain("safeguard");
    expect(result.systemPrompt).toContain("nextActionCue");
  });
});

describe("buildAarPrompt", () => {
  it("returns systemPrompt and userMessage", () => {
    const result = buildAarPrompt({
      whatHappened: "Gave a talk",
      soWhat: "Learned about pacing",
      nowWhat: "Practice timing",
      profile: null,
    });
    expect(result.systemPrompt).toBeTruthy();
    expect(result.userMessage).toContain("Gave a talk");
    expect(result.userMessage).toContain("Learned about pacing");
    expect(result.userMessage).toContain("Practice timing");
  });

  it("includes profile context", () => {
    const result = buildAarPrompt({
      whatHappened: "W",
      soWhat: "S",
      nowWhat: "N",
      profile: { role: "Director", strengths: ["strategy", "vision"] },
    });
    expect(result.systemPrompt).toContain("Director");
    expect(result.systemPrompt).toContain("strategy");
  });

  it("instructs JSON-only output with correct shape", () => {
    const result = buildAarPrompt({
      whatHappened: "W",
      soWhat: "S",
      nowWhat: "N",
      profile: null,
    });
    expect(result.systemPrompt).toContain("ONLY valid JSON");
    expect(result.systemPrompt).toContain("lessonsLearned");
    expect(result.systemPrompt).toContain("improvementPlan");
  });
});
