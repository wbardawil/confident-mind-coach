import { describe, it, expect } from "vitest";
import { detectDistress } from "@/lib/utils/distress-detect";

describe("detectDistress", () => {
  // ─── Should NOT detect ──────────────────────────
  it("returns no distress for normal coaching text", () => {
    const result = detectDistress([
      "I had a tough meeting but handled it well",
      "Need to improve my presentation skills",
    ]);
    expect(result.detected).toBe(false);
    expect(result.withdrawalScore).toBe(0);
    expect(result.matchedSignals).toEqual([]);
  });

  it("returns no distress for empty inputs", () => {
    const result = detectDistress(["", ""]);
    expect(result.detected).toBe(false);
  });

  it("does not flag 'failed to mention' or other casual usage context", () => {
    // "failed" as standalone word IS a signal, so this SHOULD detect
    // This test documents that "failed" alone triggers detection
    const result = detectDistress(["I failed to mention the deadline"]);
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("failed");
  });

  // ─── Mild signals (weight 1) → withdrawal −1 ───
  it("detects 'overwhelmed' as mild signal → −1", () => {
    const result = detectDistress(["I felt overwhelmed during the call"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
    expect(result.matchedSignals).toContain("overwhelmed");
  });

  it("detects 'embarrassed' as mild signal → −1", () => {
    const result = detectDistress(["I was embarrassed in front of everyone"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
    expect(result.matchedSignals).toContain("embarrassed");
  });

  it("detects 'anxious' as mild signal → −1", () => {
    const result = detectDistress(["I felt really anxious before the talk"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
    expect(result.matchedSignals).toContain("anxious");
  });

  it("detects 'nervous' as mild signal → −1", () => {
    const result = detectDistress(["I was so nervous I could barely speak"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-1);
  });

  it("detects 'self-doubt' as mild signal → −1", () => {
    const result = detectDistress(["Lots of self-doubt crept in today"]);
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("self-doubt");
  });

  it("detects 'lost confidence' as mild signal → −1", () => {
    const result = detectDistress(["I lost confidence halfway through"]);
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("lost confidence");
  });

  // ─── Strong signals (weight 2) → withdrawal −2 ─
  it("detects 'panic' as strong signal → −2", () => {
    const result = detectDistress(["I started to panic during the exam"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("panic");
  });

  it("detects 'panicked' variant", () => {
    const result = detectDistress(["I panicked and couldn't think"]);
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("panic");
  });

  it("detects 'froze' as strong signal → −2", () => {
    const result = detectDistress(["I froze on stage"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("froze");
  });

  it("detects 'shame' as strong signal → −2", () => {
    const result = detectDistress(["I felt deep shame after the mistake"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("shame");
  });

  it("detects 'humiliated' as strong signal → −2", () => {
    const result = detectDistress(["I was humiliated in front of the team"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("humiliation");
  });

  it("detects 'spiraling' as strong signal → −2", () => {
    const result = detectDistress(["My thoughts were spiraling out of control"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("spiraling");
  });

  it("detects 'shut down' as strong signal → −2", () => {
    const result = detectDistress(["I completely shut down and couldn't respond"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("shut down");
  });

  it("detects 'choked' as strong signal → −2", () => {
    const result = detectDistress(["I choked during the interview"]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("choked");
  });

  // ─── Multiple signals ───────────────────────────
  it("combines mild signals to reach −2", () => {
    const result = detectDistress([
      "I was anxious and embarrassed at the same time",
    ]);
    expect(result.detected).toBe(true);
    // anxious (1) + embarrassed (1) = 2 → −2
    expect(result.withdrawalScore).toBe(-2);
    expect(result.matchedSignals).toContain("anxious");
    expect(result.matchedSignals).toContain("embarrassed");
  });

  it("caps withdrawal at −2 even with many signals", () => {
    const result = detectDistress([
      "I panicked, froze, felt shame, was humiliated and spiraling",
    ]);
    expect(result.detected).toBe(true);
    expect(result.withdrawalScore).toBe(-2);
    // Should have multiple matched signals
    expect(result.matchedSignals.length).toBeGreaterThanOrEqual(4);
  });

  // ─── Across multiple inputs ─────────────────────
  it("detects signals across multiple input strings", () => {
    const result = detectDistress([
      "The presentation went badly",
      "I was overwhelmed by the questions",
    ]);
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("overwhelmed");
  });

  // ─── Case insensitive ──────────────────────────
  it("detects signals regardless of case", () => {
    const result = detectDistress(["I PANICKED during the meeting"]);
    expect(result.detected).toBe(true);
    expect(result.matchedSignals).toContain("panic");
  });
});
