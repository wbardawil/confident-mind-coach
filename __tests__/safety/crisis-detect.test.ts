import { describe, it, expect } from "vitest";
import { scanForCrisis } from "@/lib/safety/crisis-detect";

describe("scanForCrisis", () => {
  // ─── Should NOT flag ──────────────────────────
  it("does not flag normal coaching input", () => {
    const result = scanForCrisis([
      "I worked hard today",
      "Had a good meeting",
      "Making progress on my goals",
    ]);
    expect(result.flagged).toBe(false);
    expect(result.reason).toBeNull();
  });

  it("does not flag frustration or disappointment", () => {
    const result = scanForCrisis([
      "I'm really frustrated",
      "This was a terrible day",
      "I feel so angry at myself",
    ]);
    expect(result.flagged).toBe(false);
  });

  it("does not flag empty strings", () => {
    const result = scanForCrisis(["", "", ""]);
    expect(result.flagged).toBe(false);
  });

  // ─── Should flag: suicidal ideation ───────────
  it("flags 'kill myself'", () => {
    const result = scanForCrisis(["I want to kill myself"]);
    expect(result.flagged).toBe(true);
    expect(result.reason).toBeTruthy();
  });

  it("flags 'suicide'", () => {
    const result = scanForCrisis(["thinking about suicide"]);
    expect(result.flagged).toBe(true);
  });

  it("flags 'want to die'", () => {
    const result = scanForCrisis(["I just want to die"]);
    expect(result.flagged).toBe(true);
  });

  it("flags 'end it all'", () => {
    const result = scanForCrisis(["I want to end it all"]);
    expect(result.flagged).toBe(true);
  });

  it("flags 'no reason to live'", () => {
    const result = scanForCrisis(["There is no reason to live"]);
    expect(result.flagged).toBe(true);
  });

  // ─── Should flag: self-harm ───────────────────
  it("flags 'self harm'", () => {
    const result = scanForCrisis(["I've been thinking about self harm"]);
    expect(result.flagged).toBe(true);
  });

  it("flags 'cutting myself'", () => {
    const result = scanForCrisis(["I've been cutting myself"]);
    expect(result.flagged).toBe(true);
  });

  // ─── Should flag: crisis distress ─────────────
  it("flags 'can't go on'", () => {
    const result = scanForCrisis(["I can't go on anymore"]);
    expect(result.flagged).toBe(true);
  });

  it("flags 'better off dead'", () => {
    const result = scanForCrisis(["everyone would be better off dead"]);
    expect(result.flagged).toBe(true);
  });

  // ─── Across multiple inputs ───────────────────
  it("flags crisis keywords in any of the input strings", () => {
    const result = scanForCrisis([
      "Normal text here",
      "More normal text",
      "I want to kill myself",
    ]);
    expect(result.flagged).toBe(true);
  });

  // ─── Case insensitive ────────────────────────
  it("flags regardless of case", () => {
    const result = scanForCrisis(["I WANT TO KILL MYSELF"]);
    expect(result.flagged).toBe(true);
  });
});
