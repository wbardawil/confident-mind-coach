import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ───────────────────────────
// vi.hoisted() runs before vi.mock() hoisting so these are available
// inside mock factories.

const {
  mockAggregate,
  mockCount,
  mockFindMany,
} = vi.hoisted(() => ({
  mockAggregate: vi.fn(),
  mockCount: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/utils/db", () => ({
  db: {
    ledgerEntry: {
      aggregate: mockAggregate,
      count: mockCount,
      findMany: mockFindMany,
    },
  },
}));

vi.mock("@/lib/utils/user", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: "user-1",
    profile: { role: "athlete", strengths: ["focus"] },
  }),
}));

// ─── In-memory ledger store ───────────────────
// Mock implementations filter this store the same way Prisma would,
// giving us confidence in the getLedgerData aggregation logic.

interface MockEntry {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string | null;
  scoreDelta: number | null;
  sourceType: string | null;
  createdAt: Date;
}

let store: MockEntry[] = [];
let idCounter = 0;

/** Create a date N days ago from now (UTC midday to avoid boundary issues). */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

/** Helper to add an entry to the store. */
function addEntry(overrides: Partial<MockEntry> = {}): MockEntry {
  const entry: MockEntry = {
    id: `entry-${++idCounter}`,
    userId: "user-1",
    type: "DEPOSIT",
    title: "Test Entry",
    description: null,
    scoreDelta: 2,
    sourceType: "RESET",
    createdAt: new Date(),
    ...overrides,
  };
  store.push(entry);
  return entry;
}

// ─── Mock implementations ─────────────────────

function filterByWhere(where?: Record<string, unknown>): MockEntry[] {
  let entries = [...store];
  if (!where) return entries;

  if (where.userId) {
    entries = entries.filter((e) => e.userId === where.userId);
  }
  if (where.type) {
    entries = entries.filter((e) => e.type === where.type);
  }
  if (where.createdAt) {
    const ca = where.createdAt as Record<string, Date>;
    if (ca.gte) {
      entries = entries.filter((e) => e.createdAt >= ca.gte);
    }
    if (ca.lt) {
      entries = entries.filter((e) => e.createdAt < ca.lt);
    }
  }
  return entries;
}

function setupMockImplementations() {
  mockAggregate.mockImplementation((args: unknown) => {
    const where = (args as { where?: Record<string, unknown> })?.where;
    const entries = filterByWhere(where);
    // Prisma returns null only when no rows match; returns 0 when rows exist but sum to zero
    const scoreDelta = entries.length === 0
      ? null
      : entries.reduce((acc: number, e: MockEntry) => acc + (e.scoreDelta ?? 0), 0);
    return Promise.resolve({ _sum: { scoreDelta } });
  });

  mockCount.mockImplementation((args: unknown) => {
    const where = (args as { where?: Record<string, unknown> })?.where;
    return Promise.resolve(filterByWhere(where).length);
  });

  mockFindMany.mockImplementation((args: unknown) => {
    const { where, orderBy, take } = (args as {
      where?: Record<string, unknown>;
      orderBy?: Record<string, string>;
      take?: number;
    }) ?? {};

    let entries = filterByWhere(where);

    if (orderBy?.createdAt === "desc") {
      entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else if (orderBy?.createdAt === "asc") {
      entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    if (take) {
      entries = entries.slice(0, take);
    }

    return Promise.resolve(entries);
  });
}

// ─── Import after mocks ────────────────────────
import { getLedgerData } from "@/lib/actions/ledger";

// ─── Tests ─────────────────────────────────────

describe("getLedgerData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store = [];
    idCounter = 0;
    setupMockImplementations();
  });

  // ── 1. Total score calculation ──────────────────

  describe("totalScore", () => {
    it("sums deposits and withdrawals correctly", async () => {
      addEntry({ type: "DEPOSIT", scoreDelta: 2 });
      addEntry({ type: "DEPOSIT", scoreDelta: 3 });
      addEntry({ type: "WITHDRAWAL", scoreDelta: -2 });

      const data = await getLedgerData();

      expect(data).not.toBeNull();
      expect(data!.totalScore).toBe(3); // 2 + 3 + (-2)
    });

    it("handles all-negative entries", async () => {
      addEntry({ type: "WITHDRAWAL", scoreDelta: -2 });
      addEntry({ type: "WITHDRAWAL", scoreDelta: -1 });

      const data = await getLedgerData();

      expect(data!.totalScore).toBe(-3);
    });
  });

  // ── 2. Deposit and withdrawal counts ────────────

  describe("counts", () => {
    it("counts deposits and withdrawals separately", async () => {
      addEntry({ type: "DEPOSIT" });
      addEntry({ type: "DEPOSIT" });
      addEntry({ type: "DEPOSIT" });
      addEntry({ type: "WITHDRAWAL" });

      const data = await getLedgerData();

      expect(data!.depositCount).toBe(3);
      expect(data!.withdrawalCount).toBe(1);
    });

    it("does not count ADJUSTMENT entries as deposits or withdrawals", async () => {
      addEntry({ type: "DEPOSIT" });
      addEntry({ type: "ADJUSTMENT", scoreDelta: 1 });

      const data = await getLedgerData();

      expect(data!.depositCount).toBe(1);
      expect(data!.withdrawalCount).toBe(0);
    });
  });

  // ── 3. net14d includes positive and negative ────

  describe("net14d", () => {
    it("includes both deposits and withdrawals within 14 days", async () => {
      addEntry({ type: "DEPOSIT", scoreDelta: 2, createdAt: daysAgo(1) });
      addEntry({ type: "WITHDRAWAL", scoreDelta: -2, createdAt: daysAgo(3) });
      addEntry({ type: "DEPOSIT", scoreDelta: 2, createdAt: daysAgo(10) });

      const data = await getLedgerData();

      expect(data!.net14d).toBe(2); // 2 + (-2) + 2
    });

    it("excludes entries older than 14 days from net14d", async () => {
      addEntry({ type: "DEPOSIT", scoreDelta: 10, createdAt: daysAgo(20) });
      addEntry({ type: "DEPOSIT", scoreDelta: 2, createdAt: daysAgo(1) });

      const data = await getLedgerData();

      expect(data!.net14d).toBe(2); // only the recent entry
      expect(data!.totalScore).toBe(12); // but total includes both
    });
  });

  // ── 4. Trend baseline before window ─────────────

  describe("trend baseline", () => {
    it("pre-window entries set the starting cumulative value", async () => {
      // Old entry outside the 14-day window
      addEntry({ type: "DEPOSIT", scoreDelta: 10, createdAt: daysAgo(20) });
      // Recent entry within the window
      addEntry({ type: "DEPOSIT", scoreDelta: 2, createdAt: daysAgo(1) });

      const data = await getLedgerData();
      const trend = data!.trend;

      // Trend should have 14 entries
      expect(trend).toHaveLength(14);

      // First day's cumulative should start at the pre-window total (10)
      // since there are no entries on that day
      expect(trend[0].cumulative).toBe(10);

      // Last entry should be 10 + 2 = 12 (or wherever the day-1 entry lands)
      const lastDay = trend[trend.length - 1];
      // The day before today (daysAgo(1)) should bump cumulative
      const totalCumulative = trend[trend.length - 1].cumulative;
      expect(totalCumulative).toBe(12);
    });
  });

  // ── 5. Daily carry-forward ──────────────────────

  describe("carry-forward", () => {
    it("days with no entries carry forward previous cumulative", async () => {
      // Entry 5 days ago only
      addEntry({ type: "DEPOSIT", scoreDelta: 5, createdAt: daysAgo(5) });

      const data = await getLedgerData();
      const trend = data!.trend;

      // Find the entry for 5 days ago
      const fiveDaysAgoKey = daysAgo(5).toISOString().slice(0, 10);
      const idx = trend.findIndex((t) => t.date === fiveDaysAgoKey);

      expect(idx).toBeGreaterThanOrEqual(0);

      // Before that day: cumulative should be 0
      if (idx > 0) {
        expect(trend[idx - 1].cumulative).toBe(0);
      }

      // On that day: cumulative should be 5
      expect(trend[idx].cumulative).toBe(5);

      // All subsequent days should carry forward 5
      for (let i = idx + 1; i < trend.length; i++) {
        expect(trend[i].cumulative).toBe(5);
      }
    });
  });

  // ── 6. Same-day multiple entries ────────────────

  describe("same-day entries", () => {
    it("combines multiple entries on the same date", async () => {
      const today = new Date();
      today.setUTCHours(10, 0, 0, 0);
      const todayLater = new Date();
      todayLater.setUTCHours(15, 0, 0, 0);

      addEntry({ type: "DEPOSIT", scoreDelta: 2, createdAt: today });
      addEntry({ type: "WITHDRAWAL", scoreDelta: -1, createdAt: todayLater });
      addEntry({ type: "DEPOSIT", scoreDelta: 3, createdAt: todayLater });

      const data = await getLedgerData();
      const trend = data!.trend;

      // Today's cumulative should reflect all 3 entries: 2 + (-1) + 3 = 4
      const todayKey = today.toISOString().slice(0, 10);
      const todayTrend = trend.find((t) => t.date === todayKey);
      expect(todayTrend).toBeDefined();
      expect(todayTrend!.cumulative).toBe(4);
    });
  });

  // ── 7. Empty ledger ─────────────────────────────

  describe("empty ledger", () => {
    it("returns zeroes and empty arrays for empty ledger", async () => {
      const data = await getLedgerData();

      expect(data).not.toBeNull();
      expect(data!.totalScore).toBe(0);
      expect(data!.depositCount).toBe(0);
      expect(data!.withdrawalCount).toBe(0);
      expect(data!.net14d).toBe(0);
      expect(data!.recentEntries).toEqual([]);
    });

    it("trend has 14 days all at cumulative 0", async () => {
      const data = await getLedgerData();
      const trend = data!.trend;

      expect(trend).toHaveLength(14);
      for (const point of trend) {
        expect(point.cumulative).toBe(0);
      }
    });
  });

  // ── 8. Recent entries ordering ──────────────────

  describe("recentEntries", () => {
    it("returns entries in descending createdAt order", async () => {
      addEntry({ title: "Old", createdAt: daysAgo(5) });
      addEntry({ title: "Middle", createdAt: daysAgo(2) });
      addEntry({ title: "New", createdAt: daysAgo(0) });

      const data = await getLedgerData();
      const titles = data!.recentEntries.map((e) => e.title);

      expect(titles).toEqual(["New", "Middle", "Old"]);
    });

    it("includes both deposits and withdrawals in recent entries", async () => {
      addEntry({ type: "DEPOSIT", title: "Dep", createdAt: daysAgo(1) });
      addEntry({ type: "WITHDRAWAL", title: "Wd", createdAt: daysAgo(0) });

      const data = await getLedgerData();
      const types = data!.recentEntries.map((e) => e.type);

      expect(types).toContain("DEPOSIT");
      expect(types).toContain("WITHDRAWAL");
    });

    it("limits to 20 entries", async () => {
      for (let i = 0; i < 25; i++) {
        addEntry({ title: `Entry ${i}`, createdAt: daysAgo(i) });
      }

      const data = await getLedgerData();

      expect(data!.recentEntries).toHaveLength(20);
      // Should be the 20 most recent (days 0-19, not 20-24)
      expect(data!.recentEntries[0].title).toBe("Entry 0");
      expect(data!.recentEntries[19].title).toBe("Entry 19");
    });
  });

  // ── Auth guard ──────────────────────────────────

  describe("auth", () => {
    it("returns null when user is not authenticated", async () => {
      const { getCurrentUser } = await import("@/lib/utils/user");
      (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const data = await getLedgerData();
      expect(data).toBeNull();
    });
  });
});
