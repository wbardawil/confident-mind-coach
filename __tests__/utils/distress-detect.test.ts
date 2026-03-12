import { describe, it, expect } from "vitest";
import { detectDistress } from "@/lib/utils/distress-detect";

describe("detectDistress", () => {
  // ─── Should NOT detect ──────────────────────────
  it("returns no distress for normal coaching text", () => {
    const result = detectDistress({
      eventDescription: "I had a tough meeting but handled it well",
      emotionalState: "Need to improve my presentation skills",
    });
    expect(result.detected).toBe(false);
    expect(result.withdrawalScore).toBe(0);
    expect(result.matchedSignals).toEqual([]);
  });

  it("returns no distress for empty inputs", () => {
    const result = detectDistress({
      eventDescription: "",
      emotionalState: "",
    });
    expect(result.detected).toBe(false);
  });

  it("returns no distress for null/undefined inputs", () => {
    const result = detectDistress({});
    expect(result.detected).toBe(false);

    const result2 = detectDistress({
      eventDescription: null,
      emotionalState: null,
      confidenceScore: null,
    });
    expect(result2.detected).toBe(false);
  });

  it("does not flag normal text with high confidence score", () => {
    const result = detectDistress({
      eventDescription: "Had a productive day at work",
      confidenceScore: 8,
    });
    expect(result.detected).toBe(false);
  });

  // ─── Confidence score signals ───────────────────
  // 1–3 = withdrawal, 4–6 = draw, 7–10 = deposit
  it("detects confidence 1 as strong signal → −2", () => {
    const result = detectDistress({
      eventDescription: "I lost money",
      confidenceScore: 1,
    });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("very low confidence");
  });

  it("detects confidence 2 as mild signal → −1", () => {
    const result = detectDistress({
      eventDescription: "Bad day at work",
      confidenceScore: 2,
    });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
    expect(result.matchedSignals).toContain("low confidence");
  });

  it("detects confidence 3 as mild signal → −1", () => {
    const result = detectDistress({
      eventDescription: "Rough meeting today",
      confidenceScore: 3,
    });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
    expect(result.matchedSignals).toContain("low confidence");
  });

  it("does not flag confidence 4 (neutral draw)", () => {
    const result = detectDistress({
      eventDescription: "Could have gone better",
      confidenceScore: 4,
    });
    expect(result.detected).toBe(false);
  });

  it("does not flag confidence 5 (neutral draw)", () => {
    const result = detectDistress({
      eventDescription: "It was an okay day",
      confidenceScore: 5,
    });
    expect(result.detected).toBe(false);
  });

  it("does not flag confidence 7+ (deposit territory)", () => {
    const result = detectDistress({
      eventDescription: "Great day overall",
      confidenceScore: 8,
    });
    expect(result.detected).toBe(false);
  });

  it("confidence score alone (no text) triggers withdrawal", () => {
    const result = detectDistress({ confidenceScore: 1 });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("very low confidence");
  });

  it("combines low confidence with text signals", () => {
    const result = detectDistress({
      emotionalState: "I felt like a loser",
      confidenceScore: 1,
    });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("very low confidence");
    expect(result.matchedSignals).toContain("loser");
  });

  // ─── Defensive: NaN / string-as-number ──────────
  it("ignores NaN confidenceScore", () => {
    const result = detectDistress({
      eventDescription: "Good day",
      confidenceScore: NaN,
    });
    expect(result.detected).toBe(false);
  });

  it("ignores non-number confidenceScore", () => {
    // TypeScript protects, but test runtime safety for JS callers
    const result = detectDistress({
      eventDescription: "Good day",
      confidenceScore: "1" as unknown as number,
    });
    // Should NOT crash, should treat as no score
    expect(result.detected).toBe(false);
  });

  // ─── Keyword: loser / looser ────────────────────
  it("detects 'loser'", () => {
    const result = detectDistress({ emotionalState: "I felt like a loser" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("loser");
  });

  it("detects 'looser' (common misspelling)", () => {
    const result = detectDistress({ emotionalState: "I felt like a looser" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("loser");
  });

  it("detects 'lost' as a distress keyword", () => {
    const result = detectDistress({ eventDescription: "I lost the opportunity" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("loser");
  });

  // ─── New keywords: devastated, crushed, etc. ────
  it("detects 'devastated' as strong signal → −2", () => {
    const result = detectDistress({ emotionalState: "I was devastated by the news" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("devastated");
  });

  it("detects 'crushed' as strong signal → −2", () => {
    const result = detectDistress({ emotionalState: "I felt absolutely crushed" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("crushed");
  });

  it("detects 'hopeless'", () => {
    const result = detectDistress({ emotionalState: "It all feels hopeless" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("hopeless");
  });

  it("detects 'defeated'", () => {
    const result = detectDistress({ emotionalState: "I feel completely defeated" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("defeated");
  });

  it("detects 'terrible'", () => {
    const result = detectDistress({ eventDescription: "It was a terrible performance" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("terrible");
  });

  it("detects 'messed up'", () => {
    const result = detectDistress({ eventDescription: "I really messed up today" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("messed up");
  });

  it("detects 'blew it'", () => {
    const result = detectDistress({ eventDescription: "I blew it in the interview" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("blew it");
  });

  it("detects 'bombed'", () => {
    const result = detectDistress({ eventDescription: "I bombed the presentation" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("bombed");
  });

  // ─── Mild signals (weight 1) → withdrawal −1 ───
  it("detects 'overwhelmed' as mild signal → −1", () => {
    const result = detectDistress({ emotionalState: "I felt overwhelmed during the call" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
    expect(result.matchedSignals).toContain("overwhelmed");
  });

  it("detects 'embarrassed' as mild signal → −1", () => {
    const result = detectDistress({ emotionalState: "I was embarrassed in front of everyone" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
    expect(result.matchedSignals).toContain("embarrassed");
  });

  it("detects 'anxious' as mild signal → −1", () => {
    const result = detectDistress({ emotionalState: "I felt really anxious before the talk" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
    expect(result.matchedSignals).toContain("anxious");
  });

  it("detects 'nervous' as mild signal → −1", () => {
    const result = detectDistress({ emotionalState: "I was so nervous I could barely speak" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
  });

  it("detects 'self-doubt' as mild signal", () => {
    const result = detectDistress({ emotionalState: "Lots of self-doubt crept in today" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("self-doubt");
  });

  it("detects 'lost confidence' as mild signal", () => {
    const result = detectDistress({ emotionalState: "I lost confidence halfway through" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("lost confidence");
  });

  // ─── Strong signals (weight 2) → withdrawal −2 ─
  it("detects 'panic' as strong signal → −2", () => {
    const result = detectDistress({ emotionalState: "I started to panic during the exam" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("panic");
  });

  it("detects 'panicked' variant", () => {
    const result = detectDistress({ emotionalState: "I panicked and couldn't think" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("panic");
  });

  it("detects 'froze' as strong signal → −2", () => {
    const result = detectDistress({ emotionalState: "I froze on stage" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("froze");
  });

  it("detects 'shame' as strong signal → −2", () => {
    const result = detectDistress({ emotionalState: "I felt deep shame after the mistake" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("shame");
  });

  it("detects 'humiliated' as strong signal → −2", () => {
    const result = detectDistress({ emotionalState: "I was humiliated in front of the team" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("humiliation");
  });

  it("detects 'spiraling' as strong signal → −2", () => {
    const result = detectDistress({ emotionalState: "My thoughts were spiraling out of control" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("spiraling");
  });

  it("detects 'shut down' as strong signal → −2", () => {
    const result = detectDistress({ emotionalState: "I completely shut down and couldn't respond" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("shut down");
  });

  it("detects 'choked' as strong signal → −2", () => {
    const result = detectDistress({ emotionalState: "I choked during the interview" });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("choked");
  });

  // ─── Multiple signals ───────────────────────────
  it("combines mild signals to reach −2", () => {
    const result = detectDistress({
      emotionalState: "I was anxious and embarrassed at the same time",
    });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("anxious");
    expect(result.matchedSignals).toContain("embarrassed");
  });

  it("caps withdrawal at −2 even with many signals", () => {
    const result = detectDistress({
      emotionalState: "I panicked, froze, felt shame, was humiliated and spiraling",
    });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals.length).toBeGreaterThanOrEqual(4);
  });

  // ─── Across eventDescription + emotionalState ───
  it("detects signals spread across both text fields", () => {
    const result = detectDistress({
      eventDescription: "The presentation went badly",
      emotionalState: "I was overwhelmed by the questions",
    });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("overwhelmed");
  });

  // ─── Case insensitive ──────────────────────────
  it("detects signals regardless of case", () => {
    const result = detectDistress({ emotionalState: "I PANICKED during the meeting" });
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("panic");
  });

  // ─── Real-world scenario: the user's exact case ─
  it("detects 'lost money + felt like a looser + confidence 1'", () => {
    const result = detectDistress({
      eventDescription: "I lost money",
      emotionalState: "I felt like a looser",
      confidenceScore: 1,
    });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("very low confidence");
    expect(result.matchedSignals).toContain("loser");
  });

  // ─── Exact Reset form shape test ────────────────
  it("works with the exact shape passed by submitReset action", () => {
    // This mirrors exactly what the server action sends:
    // detectDistress({ eventDescription, emotionalState, confidenceScore })
    const result = detectDistress({
      eventDescription: "I lost money",
      emotionalState: "I felt like a looser",
      confidenceScore: 1,
    });
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    // Must contain both score-based and text-based signals
    expect(result.matchedSignals).toContain("very low confidence");
    expect(result.matchedSignals).toContain("loser");
  });
});
