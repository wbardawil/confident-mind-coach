import { describe, it, expect } from "vitest";

/**
 * Tests for the LedgerTrend bar height calculation logic.
 *
 * The component uses pixel heights (not percentages) to render bars.
 * This file tests the core calculation extracted from the component:
 *   - ratio = range === 0 ? 0.5 : (cumulative - min) / range
 *   - barPx = Math.max(Math.round(ratio * CHART_HEIGHT), MIN_BAR_PX)
 */

const CHART_HEIGHT = 120;
const MIN_BAR_PX = 4;

/** Mirror of the component's bar height calculation. */
function computeBarPx(
  cumulative: number,
  min: number,
  max: number,
): number {
  const range = max - min;
  const ratio = range === 0 ? 0.5 : (cumulative - min) / range;
  return Math.max(Math.round(ratio * CHART_HEIGHT), MIN_BAR_PX);
}

/** Compute bar heights for a full trend series. */
function computeSeries(values: number[]): number[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  return values.map((v) => computeBarPx(v, min, max));
}

describe("LedgerTrend bar height calculation", () => {
  // ── Flat series (the original bug) ──────────────────

  describe("flat series", () => {
    it("all-zero series renders bars at half chart height", () => {
      const bars = computeSeries([0, 0, 0, 0, 0]);
      const expected = Math.max(Math.round(0.5 * CHART_HEIGHT), MIN_BAR_PX);
      for (const bar of bars) {
        expect(bar).toBe(expected); // 60px
      }
    });

    it("constant positive series renders bars at half chart height", () => {
      const bars = computeSeries([5, 5, 5, 5, 5]);
      const expected = Math.max(Math.round(0.5 * CHART_HEIGHT), MIN_BAR_PX);
      for (const bar of bars) {
        expect(bar).toBe(expected);
      }
    });

    it("constant negative series renders bars at half chart height", () => {
      const bars = computeSeries([-3, -3, -3]);
      const expected = Math.max(Math.round(0.5 * CHART_HEIGHT), MIN_BAR_PX);
      for (const bar of bars) {
        expect(bar).toBe(expected);
      }
    });

    it("single data point renders at half chart height", () => {
      const bars = computeSeries([7]);
      expect(bars[0]).toBe(Math.round(0.5 * CHART_HEIGHT));
    });
  });

  // ── Normal rising/falling series ────────────────────

  describe("rising series", () => {
    it("lowest value gets minimum bar height", () => {
      const bars = computeSeries([0, 2, 4, 6, 8, 10]);
      expect(bars[0]).toBe(MIN_BAR_PX); // 0 is min → ratio 0 → clamped to 4px
    });

    it("highest value gets full chart height", () => {
      const bars = computeSeries([0, 2, 4, 6, 8, 10]);
      expect(bars[bars.length - 1]).toBe(CHART_HEIGHT); // ratio 1.0 → 120px
    });

    it("middle value is proportional", () => {
      const bars = computeSeries([0, 5, 10]);
      // ratio for 5 = (5-0)/(10-0) = 0.5 → 60px
      expect(bars[1]).toBe(60);
    });
  });

  describe("falling series", () => {
    it("first bar is tallest, last bar is shortest", () => {
      const bars = computeSeries([10, 8, 6, 4, 2, 0]);
      expect(bars[0]).toBe(CHART_HEIGHT);
      expect(bars[bars.length - 1]).toBe(MIN_BAR_PX);
    });
  });

  describe("mixed series", () => {
    it("handles negative to positive range", () => {
      const bars = computeSeries([-5, 0, 5]);
      // min=-5, max=5, range=10
      // -5 → ratio 0 → 4px (clamped)
      // 0  → ratio 0.5 → 60px
      // 5  → ratio 1.0 → 120px
      expect(bars[0]).toBe(MIN_BAR_PX);
      expect(bars[1]).toBe(60);
      expect(bars[2]).toBe(CHART_HEIGHT);
    });

    it("handles all-negative range", () => {
      const bars = computeSeries([-10, -6, -2]);
      // min=-10, max=-2, range=8
      // -10 → ratio 0 → 4px
      // -2  → ratio 1.0 → 120px
      expect(bars[0]).toBe(MIN_BAR_PX);
      expect(bars[2]).toBe(CHART_HEIGHT);
    });
  });

  // ── Minimum bar height guarantee ────────────────────

  describe("minimum bar height", () => {
    it("bars never go below MIN_BAR_PX", () => {
      const bars = computeSeries([0, 100]);
      // 0 → ratio 0 → 0px → clamped to 4px
      expect(bars[0]).toBe(MIN_BAR_PX);
      expect(bars[0]).toBeGreaterThanOrEqual(MIN_BAR_PX);
    });

    it("all bars in a large range are at least MIN_BAR_PX", () => {
      const bars = computeSeries([0, 1, 2, 3, 100]);
      for (const bar of bars) {
        expect(bar).toBeGreaterThanOrEqual(MIN_BAR_PX);
      }
    });
  });

  // ── 14-day typical scenario ─────────────────────────

  describe("14-day realistic scenario", () => {
    it("handles typical 14-day trend with carry-forward", () => {
      // Simulates: baseline 10, activity on days 5 and 10
      const values = [10, 10, 10, 10, 10, 12, 12, 12, 12, 12, 14, 14, 14, 14];
      const bars = computeSeries(values);

      expect(bars).toHaveLength(14);

      // All bars should be visible
      for (const bar of bars) {
        expect(bar).toBeGreaterThanOrEqual(MIN_BAR_PX);
      }

      // First 5 bars should be equal (all at cumulative 10)
      expect(bars[0]).toBe(bars[1]);
      expect(bars[1]).toBe(bars[4]);

      // Last 4 bars should be tallest (cumulative 14)
      expect(bars[13]).toBe(CHART_HEIGHT);

      // Bars should step up
      expect(bars[5]).toBeGreaterThan(bars[0]);
      expect(bars[10]).toBeGreaterThan(bars[5]);
    });
  });
});
