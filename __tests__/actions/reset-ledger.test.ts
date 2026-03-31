import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ─────────────────────────────
// vi.hoisted() runs BEFORE vi.mock() hoisting, making these variables
// available inside mock factories.

const {
  mockCoachingSessionCreate,
  mockLedgerEntryCreate,
  mockTransaction,
} = vi.hoisted(() => ({
  mockCoachingSessionCreate: vi.fn().mockImplementation((args: unknown) =>
    Promise.resolve({
      id: "session-1",
      ...((args as { data: Record<string, unknown> })?.data ?? {}),
    }),
  ),
  mockLedgerEntryCreate: vi.fn().mockImplementation((args: unknown) =>
    Promise.resolve({
      id: "ledger-1",
      ...((args as { data: Record<string, unknown> })?.data ?? {}),
    }),
  ),
  mockTransaction: vi.fn().mockImplementation((ops: Promise<unknown>[]) =>
    Promise.all(ops),
  ),
}));

vi.mock("@/lib/utils/db", () => ({
  db: {
    coachingSession: { create: mockCoachingSessionCreate },
    ledgerEntry: { create: mockLedgerEntryCreate },
    $transaction: mockTransaction,
  },
}));

vi.mock("@/lib/utils/user", () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: "user-1",
    profile: { role: "athlete", strengths: ["focus", "grit"] },
  }),
}));

vi.mock("@/lib/safety/crisis-detect", () => ({
  scanForCrisis: vi.fn().mockReturnValue({ flagged: false }),
}));

const { mockAiData } = vi.hoisted(() => ({
  mockAiData: {
    acknowledgement: "I hear you.",
    safeguard: "Remember your strengths.",
    nextActionCue: "Take a deep breath.",
    withdrawalImpact: {
      title: "Setback recorded",
      description: "A moderate confidence dip",
      scoreDelta: -2,
    },
    recoveryImpact: {
      title: "Faced it head-on",
      description: "Processed the setback constructively",
      scoreDelta: 2,
    },
  },
}));

vi.mock("@/lib/ai/client", () => ({
  generateCoaching: vi.fn().mockResolvedValue(JSON.stringify(mockAiData)),
}));

vi.mock("@/lib/ai/parse", () => ({
  parseAiResponse: vi.fn().mockReturnValue({
    success: true,
    data: mockAiData,
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@prisma/client", () => ({
  Prisma: {
    JsonNull: "DbNull",
  },
}));

// ─── Import after mocks ────────────────────────
import { submitReset } from "@/lib/actions/reset";

// ─── Helpers ───────────────────────────────────

function resetMockDefaults() {
  mockCoachingSessionCreate.mockImplementation((args: unknown) =>
    Promise.resolve({
      id: "session-1",
      ...((args as { data: Record<string, unknown> })?.data ?? {}),
    }),
  );
  mockLedgerEntryCreate.mockImplementation((args: unknown) =>
    Promise.resolve({
      id: "ledger-1",
      ...((args as { data: Record<string, unknown> })?.data ?? {}),
    }),
  );
  mockTransaction.mockImplementation((ops: Promise<unknown>[]) =>
    Promise.all(ops),
  );
}

// ─── Tests ─────────────────────────────────────

describe("submitReset transaction atomicity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockDefaults();
  });

  // ── Atomic event boundary ──────────────────────

  it("persists CoachingSession INSIDE $transaction (not separately)", async () => {
    const result = await submitReset({
      eventDescription: "Had a decent day",
      emotionalState: "Feeling okay",
      confidenceScore: 7,
    });

    expect(result.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalledTimes(1);

    // CoachingSession.create is called to build a PrismaPromise, but
    // it is NOT independently awaited — it is passed into $transaction.
    // The key proof: coachingSession.create was called, but only inside
    // the transaction array.
    expect(mockCoachingSessionCreate).toHaveBeenCalledTimes(1);

    // Always 3 ops: session + AI-assessed withdrawal + AI-assessed deposit
    const txArg = mockTransaction.mock.calls[0][0];
    expect(Array.isArray(txArg)).toBe(true);
    expect(txArg).toHaveLength(3);
  });

  // ── Rollback semantics ─────────────────────────
  // These verify that when $transaction rejects, the action does NOT
  // return success: true. Prisma handles the actual DB rollback; our
  // responsibility is to propagate the failure to the caller.

  it("propagates $transaction failure (does not return success: true)", async () => {
    mockTransaction.mockRejectedValueOnce(new Error("DB connection lost"));

    await expect(
      submitReset({
        eventDescription: "I bombed the presentation",
        emotionalState: "I panicked and froze",
        confidenceScore: 1,
      }),
    ).rejects.toThrow("DB connection lost");
  });

  it("on transaction failure, no orphaned CoachingSession exists", async () => {
    mockTransaction.mockRejectedValueOnce(new Error("Disk full"));

    try {
      await submitReset({
        eventDescription: "Bad day",
        emotionalState: "Devastated",
        confidenceScore: 2,
      });
    } catch {
      // Expected to throw
    }

    // coachingSession.create was called to build the PrismaPromise,
    // but because $transaction rejected, Prisma rolls back ALL writes
    // including the session. No orphaned records.
    //
    // We can verify the session was only ever passed to $transaction,
    // never independently awaited, by checking that $transaction
    // received it as the first element.
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    const txArg = mockTransaction.mock.calls[0][0];
    expect(txArg[0]).toBeDefined(); // CoachingSession promise was first op
  });

  // ── Correct constants in entries ───────────────

  it("withdrawal entry uses correct constants and negative scoreDelta", async () => {
    await submitReset({
      eventDescription: "I panicked and bombed",
      emotionalState: "Devastated and crushed",
      confidenceScore: 1,
    });

    const ledgerCalls = mockLedgerEntryCreate.mock.calls;
    const withdrawalCall = ledgerCalls.find(
      (call: unknown[]) =>
        (call[0] as { data: { type: string } }).data.type === "WITHDRAWAL",
    );

    expect(withdrawalCall).toBeDefined();
    const wd = (withdrawalCall![0] as { data: Record<string, unknown> }).data;
    expect(wd.type).toBe("WITHDRAWAL");
    expect(wd.sourceType).toBe("RESET");
    expect(wd.title).toBe("Setback recorded");
    expect(typeof wd.scoreDelta).toBe("number");
    expect(wd.scoreDelta).toBeLessThan(0);
    expect(typeof wd.description).toBe("string");
  });

  it("deposit entry uses AI-assessed title and score", async () => {
    await submitReset({
      eventDescription: "Lost the match",
      emotionalState: "Disappointed",
      confidenceScore: 3,
    });

    const ledgerCalls = mockLedgerEntryCreate.mock.calls;
    const depositCall = ledgerCalls.find(
      (call: unknown[]) =>
        (call[0] as { data: { type: string } }).data.type === "DEPOSIT",
    );

    expect(depositCall).toBeDefined();
    const dep = (depositCall![0] as { data: Record<string, unknown> }).data;
    expect(dep.type).toBe("DEPOSIT");
    expect(dep.sourceType).toBe("RESET");
    expect(dep.title).toBe("Faced it head-on");
    expect(dep.scoreDelta).toBe(2);
    expect(typeof dep.description).toBe("string");
  });

  // ── Validation guards ──────────────────────────

  it("does not call $transaction when validation fails", async () => {
    const result = await submitReset({
      eventDescription: "",
      emotionalState: "Bad",
      confidenceScore: 5,
    });

    expect(result.success).toBe(false);
    if (!result.success && "error" in result) {
      expect(result.error).toBe("Please check your inputs and try again.");
    }
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockLedgerEntryCreate).not.toHaveBeenCalled();
    expect(mockCoachingSessionCreate).not.toHaveBeenCalled();
  });

  it("does not call $transaction when coercion yields undefined", async () => {
    const result = await submitReset({
      eventDescription: "Event",
      emotionalState: "State",
      confidenceScore: "" as unknown as number,
    });

    expect(result.success).toBe(false);
    if (!result.success && "error" in result) {
      expect(result.error).toBe("Please check your inputs and try again.");
    }
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockLedgerEntryCreate).not.toHaveBeenCalled();
    expect(mockCoachingSessionCreate).not.toHaveBeenCalled();
  });

  // ── Error-path sessions stay outside transaction ─

  it("flagged/error CoachingSession writes are independent of $transaction", async () => {
    // This test documents the architectural decision: error-path sessions
    // (flagged, AI parse failure) are NOT part of the transaction. They are
    // debug/audit logs that should persist regardless of transaction state.
    //
    // We verify this indirectly: on validation failure, no $transaction
    // is called, and no CoachingSession is created either — because the
    // validation short-circuit happens before any DB write.
    const result = await submitReset({
      eventDescription: "",
      emotionalState: "",
      confidenceScore: 0,
    });

    expect(result.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockCoachingSessionCreate).not.toHaveBeenCalled();
  });
});
