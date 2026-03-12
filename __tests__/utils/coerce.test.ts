import { describe, it, expect } from "vitest";
import { coerceToNumber } from "@/lib/utils/coerce";

describe("coerceToNumber", () => {
  // ─── Valid numbers ────────────────────────────
  it("returns a number when given a number", () => {
    expect(coerceToNumber(5)).toBe(5);
  });

  it("returns 0 when given 0", () => {
    expect(coerceToNumber(0)).toBe(0);
  });

  it("returns negative numbers", () => {
    expect(coerceToNumber(-3)).toBe(-3);
  });

  it("returns floats", () => {
    expect(coerceToNumber(2.5)).toBe(2.5);
  });

  // ─── Valid numeric strings ────────────────────
  it("parses '1' to 1", () => {
    expect(coerceToNumber("1")).toBe(1);
  });

  it("parses '2' to 2", () => {
    expect(coerceToNumber("2")).toBe(2);
  });

  it("parses '10' to 10", () => {
    expect(coerceToNumber("10")).toBe(10);
  });

  it("parses '2.5' to 2.5", () => {
    expect(coerceToNumber("2.5")).toBe(2.5);
  });

  it("parses '-1' to -1", () => {
    expect(coerceToNumber("-1")).toBe(-1);
  });

  it("parses '0' to 0", () => {
    expect(coerceToNumber("0")).toBe(0);
  });

  it("trims whitespace before parsing", () => {
    expect(coerceToNumber("  5  ")).toBe(5);
  });

  // ─── Empty / whitespace strings → undefined ──
  // These are the critical cases: Number("") === 0 which is a footgun
  it("returns undefined for empty string (not 0)", () => {
    expect(coerceToNumber("")).toBeUndefined();
    // Verify Number("") would have silently returned 0
    expect(Number("")).toBe(0);
  });

  it("returns undefined for whitespace-only string (not 0)", () => {
    expect(coerceToNumber("   ")).toBeUndefined();
    // Verify Number("   ") would have silently returned 0
    expect(Number("   ")).toBe(0);
  });

  it("returns undefined for tab-only string", () => {
    expect(coerceToNumber("\t")).toBeUndefined();
  });

  it("returns undefined for newline-only string", () => {
    expect(coerceToNumber("\n")).toBeUndefined();
  });

  // ─── Non-numeric strings → undefined ──────────
  it("returns undefined for 'abc'", () => {
    expect(coerceToNumber("abc")).toBeUndefined();
  });

  it("returns undefined for 'NaN' string", () => {
    expect(coerceToNumber("NaN")).toBeUndefined();
  });

  it("returns undefined for 'Infinity' string", () => {
    expect(coerceToNumber("Infinity")).toBeUndefined();
  });

  it("returns undefined for '-Infinity' string", () => {
    expect(coerceToNumber("-Infinity")).toBeUndefined();
  });

  it("returns undefined for mixed alphanumeric '1abc'", () => {
    expect(coerceToNumber("1abc")).toBeUndefined();
  });

  it("returns undefined for 'abc1'", () => {
    expect(coerceToNumber("abc1")).toBeUndefined();
  });

  // ─── NaN / Infinity number values → undefined ─
  it("returns undefined for NaN", () => {
    expect(coerceToNumber(NaN)).toBeUndefined();
  });

  it("returns undefined for Infinity", () => {
    expect(coerceToNumber(Infinity)).toBeUndefined();
  });

  it("returns undefined for -Infinity", () => {
    expect(coerceToNumber(-Infinity)).toBeUndefined();
  });

  // ─── null / undefined → undefined ─────────────
  it("returns undefined for null", () => {
    expect(coerceToNumber(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(coerceToNumber(undefined)).toBeUndefined();
  });

  // ─── Other types → undefined ──────────────────
  it("returns undefined for boolean true", () => {
    expect(coerceToNumber(true)).toBeUndefined();
  });

  it("returns undefined for boolean false", () => {
    expect(coerceToNumber(false)).toBeUndefined();
  });

  it("returns undefined for object", () => {
    expect(coerceToNumber({})).toBeUndefined();
  });

  it("returns undefined for array", () => {
    expect(coerceToNumber([5])).toBeUndefined();
  });
});
