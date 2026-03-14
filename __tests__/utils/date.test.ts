import { describe, it, expect } from "vitest";
import { utcDaysAgo, toUTCDateKey } from "@/lib/utils/date";

describe("utcDaysAgo", () => {
  it("returns UTC midnight for today when n=0", () => {
    const d = utcDaysAgo(0);
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCMinutes()).toBe(0);
    expect(d.getUTCSeconds()).toBe(0);
    expect(d.getUTCMilliseconds()).toBe(0);
  });

  it("returns a date exactly N days before today in UTC", () => {
    const now = new Date();
    const d = utcDaysAgo(7);
    // The UTC date should be 7 days before today's UTC date
    const expectedDate = new Date();
    expectedDate.setUTCDate(expectedDate.getUTCDate() - 7);
    expectedDate.setUTCHours(0, 0, 0, 0);
    expect(d.getTime()).toBe(expectedDate.getTime());
  });

  it("returns UTC midnight regardless of local timezone offset", () => {
    // The key property: getUTCHours is always 0, even if local time differs
    const d = utcDaysAgo(3);
    expect(d.getUTCHours()).toBe(0);
    // toISOString always ends in T00:00:00.000Z for midnight UTC
    expect(d.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });

  it("handles crossing month boundaries", () => {
    // 40 days ago should still produce a valid date
    const d = utcDaysAgo(40);
    expect(d instanceof Date).toBe(true);
    expect(Number.isNaN(d.getTime())).toBe(false);
    expect(d.getUTCHours()).toBe(0);
  });

  it("handles crossing year boundaries", () => {
    const d = utcDaysAgo(400);
    expect(Number.isNaN(d.getTime())).toBe(false);
    expect(d.getUTCHours()).toBe(0);
  });

  it("daysAgo(0) and daysAgo(1) differ by exactly 24 hours", () => {
    const today = utcDaysAgo(0);
    const yesterday = utcDaysAgo(1);
    const diff = today.getTime() - yesterday.getTime();
    expect(diff).toBe(24 * 60 * 60 * 1000);
  });
});

describe("toUTCDateKey", () => {
  it("formats a date as YYYY-MM-DD in UTC", () => {
    const d = new Date("2026-03-13T15:30:00Z");
    expect(toUTCDateKey(d)).toBe("2026-03-13");
  });

  it("uses UTC date even if local date would differ", () => {
    // 2026-03-14T01:00:00Z is March 14 in UTC but could be March 13 in UTC-8
    // toUTCDateKey should always return the UTC date
    const d = new Date("2026-03-14T01:00:00Z");
    expect(toUTCDateKey(d)).toBe("2026-03-14");
  });

  it("handles midnight UTC exactly", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");
    expect(toUTCDateKey(d)).toBe("2026-01-01");
  });

  it("handles end of day UTC", () => {
    const d = new Date("2026-12-31T23:59:59.999Z");
    expect(toUTCDateKey(d)).toBe("2026-12-31");
  });

  it("pads single-digit months and days", () => {
    const d = new Date("2026-01-05T12:00:00Z");
    expect(toUTCDateKey(d)).toBe("2026-01-05");
  });
});
