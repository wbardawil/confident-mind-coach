import { describe, it, expect } from "vitest";
import {
  getSessionLimit,
  getMonthlyMessageCap,
  hasChatAccess,
  isChatTrial,
  isModelAllowed,
  getAllowedModels,
  type PlanTier,
  MEMORY_DEPTH_BY_TIER,
} from "@/lib/stripe/config";

describe("stripe/config", () => {
  describe("getSessionLimit", () => {
    it("limits free tier to 3 sessions/day", () => {
      expect(getSessionLimit("free")).toBe(3);
    });

    it("gives unlimited sessions to all paid tiers", () => {
      for (const tier of ["confident", "coach", "pro", "elite"]) {
        expect(getSessionLimit(tier)).toBe(Infinity);
      }
    });

    it("defaults unknown tier to 3", () => {
      expect(getSessionLimit("unknown")).toBe(3);
    });
  });

  describe("getMonthlyMessageCap", () => {
    it("gives 0 messages to free tier", () => {
      expect(getMonthlyMessageCap("free")).toBe(0);
    });

    it("gives 100 trial messages to confident tier", () => {
      expect(getMonthlyMessageCap("confident")).toBe(100);
    });

    it("gives 900 messages to coach and pro tiers", () => {
      expect(getMonthlyMessageCap("coach")).toBe(900);
      expect(getMonthlyMessageCap("pro")).toBe(900);
    });

    it("gives 450 messages to elite tier", () => {
      expect(getMonthlyMessageCap("elite")).toBe(450);
    });

    it("defaults unknown tier to 0", () => {
      expect(getMonthlyMessageCap("unknown")).toBe(0);
    });
  });

  describe("hasChatAccess", () => {
    it("denies chat to free tier", () => {
      expect(hasChatAccess("free")).toBe(false);
    });

    it("grants trial chat to confident tier", () => {
      expect(hasChatAccess("confident")).toBe(true);
    });

    it("grants chat to coach, pro, elite tiers", () => {
      expect(hasChatAccess("coach")).toBe(true);
      expect(hasChatAccess("pro")).toBe(true);
      expect(hasChatAccess("elite")).toBe(true);
    });
  });

  describe("isChatTrial", () => {
    it("identifies confident as trial", () => {
      expect(isChatTrial("confident")).toBe(true);
    });

    it("does not identify paid chat tiers as trial", () => {
      expect(isChatTrial("coach")).toBe(false);
      expect(isChatTrial("pro")).toBe(false);
      expect(isChatTrial("elite")).toBe(false);
    });
  });

  describe("model gating", () => {
    it("only allows haiku for free and confident tiers", () => {
      expect(getAllowedModels("free")).toEqual(["haiku-4.5"]);
      expect(getAllowedModels("confident")).toEqual(["haiku-4.5"]);
    });

    it("allows haiku only for coach tier", () => {
      expect(getAllowedModels("coach")).toEqual(["haiku-4.5"]);
    });

    it("allows haiku + sonnet for pro tier", () => {
      const models = getAllowedModels("pro");
      expect(models).toContain("haiku-4.5");
      expect(models).toContain("sonnet-4");
      expect(models).not.toContain("opus-3");
    });

    it("allows all models for elite tier", () => {
      const models = getAllowedModels("elite");
      expect(models).toContain("haiku-4.5");
      expect(models).toContain("sonnet-4");
      expect(models).toContain("opus-3");
    });

    it("validates model access correctly", () => {
      expect(isModelAllowed("coach", "haiku-4.5")).toBe(true);
      expect(isModelAllowed("coach", "sonnet-4")).toBe(false);
      expect(isModelAllowed("pro", "sonnet-4")).toBe(true);
      expect(isModelAllowed("pro", "opus-3")).toBe(false);
      expect(isModelAllowed("elite", "opus-3")).toBe(true);
    });
  });

  describe("memory depth", () => {
    it("gives no chat sessions to free/confident", () => {
      expect(MEMORY_DEPTH_BY_TIER.free.sessions).toBe(0);
      expect(MEMORY_DEPTH_BY_TIER.confident.sessions).toBe(0);
    });

    it("scales sessions with tier", () => {
      expect(MEMORY_DEPTH_BY_TIER.coach.sessions).toBe(20);
      expect(MEMORY_DEPTH_BY_TIER.pro.sessions).toBe(30);
      expect(MEMORY_DEPTH_BY_TIER.elite.sessions).toBe(40);
    });

    it("all tiers have ESP and AAR depth", () => {
      for (const tier of Object.keys(MEMORY_DEPTH_BY_TIER) as PlanTier[]) {
        expect(MEMORY_DEPTH_BY_TIER[tier].esp).toBeGreaterThan(0);
        expect(MEMORY_DEPTH_BY_TIER[tier].aar).toBeGreaterThan(0);
      }
    });
  });

  describe("profitability invariants", () => {
    // Ensure caps maintain minimum margins
    // These are guardrails — if someone changes a cap, this test breaks

    it("elite cap is lower than coach/pro (Opus cost control)", () => {
      expect(getMonthlyMessageCap("elite")).toBeLessThan(getMonthlyMessageCap("coach"));
    });

    it("trial cap is significantly lower than paid caps", () => {
      expect(getMonthlyMessageCap("confident")).toBeLessThanOrEqual(100);
    });

    it("no tier exceeds 900 messages/month", () => {
      for (const tier of ["free", "confident", "coach", "pro", "elite"]) {
        expect(getMonthlyMessageCap(tier)).toBeLessThanOrEqual(900);
      }
    });
  });
});
