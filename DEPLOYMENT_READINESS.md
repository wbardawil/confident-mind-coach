# Deployment Readiness Gap Analysis

**Last updated:** 2026-03-13
**Phase:** 6 (Stabilization) — pre-deployment assessment

---

## Well Covered (high confidence)

- **Input validation**: All 4 coaching flows validate via Zod with safe `coerceToNumber`. Edge cases tested (empty string, whitespace, NaN, Infinity, null, boolean).
- **Crisis safety**: `scanForCrisis` checked server-side before any AI call. Flagged sessions logged with `Prisma.JsonNull`. 17 keyword/phrase tests.
- **AI output parsing**: `parseAiResponse` validates AI JSON against per-flow Zod schemas. Malformed/partial responses produce structured error results, never raw pass-through. 9 parse tests + 12 schema tests.
- **Distress detection**: Rule-based `detectDistress` scans text + confidence score. Withdrawal scores capped at −2. 45 tests covering keywords, misspellings, score thresholds, combined signals.
- **Transaction atomicity**: All 4 flows use `db.$transaction` for persistence. Withdrawal + deposit writes are atomic — no partial confidence loss on DB failure. 9 transaction tests + 3 rollback tests.
- **Shared execution shell**: `runCoachingFlow` extracts auth → validate → safety → AI → parse. All 4 flows migrated. Consistent error handling and return types.
- **Ledger aggregation logic**: `getLedgerData` tested for score sums, type counting, 14-day windowing, trend carry-forward, same-day combining, empty state, ordering, and auth guard. 15 tests.
- **Mock fidelity**: Prisma `_sum` null-vs-zero semantics corrected — `null` only when no rows match, `0` when rows exist but sum to zero.

**Total test coverage: 206 tests across 14 files, all passing.**

---

## Requires Real DB Verification

These behaviors are tested against in-memory mocks. The mocks are faithful to documented Prisma behavior, but real PostgreSQL may surface issues mocks cannot:

1. **Transaction isolation level**: Mocks simulate batch `$transaction` as `Promise.all`. Real Prisma uses serializable isolation by default. Verify no deadlocks under concurrent Reset submissions.
2. **Date boundary behavior**: `daysAgo()` uses `setHours(0,0,0,0)` (local midnight). In production with `timestamptz`, timezone offsets could shift entries across day boundaries. Verify trend grouping matches expectations in the deployed timezone.
3. **Aggregate on empty tables**: Prisma docs say `_sum` returns `null` for no matching rows. Mocks now match this. Confirm with a fresh user (zero ledger entries).
4. **`findMany` with `select`**: Mocks return full objects; real Prisma returns only selected fields. No code depends on non-selected fields, but worth a smoke test.
5. **`$transaction` timeout**: Default Prisma transaction timeout is 5s. ESP's interactive transaction (4 writes with cross-references) should complete well within this, but verify under load.

---

## Must Check Before Phase 8

| Item | Risk | Notes |
|------|------|-------|
| Clerk auth in production | High | `getCurrentUser()` wraps Clerk. Verify session token refresh, middleware config, and edge runtime compatibility. |
| Anthropic API rate limits | Medium | No retry/backoff logic on AI calls. A 429 or 500 from Anthropic surfaces as an unhandled error to the user. |
| Environment variables | High | `DATABASE_URL`, `CLERK_*`, `ANTHROPIC_API_KEY` must be set. No `.env.example` or startup validation exists. |
| Prisma migrations | High | Schema changes (ledger, coaching sessions) need `prisma migrate deploy` in CI/CD. No migration pipeline documented. |
| Error UX on transaction failure | Medium | Transaction errors propagate as unhandled exceptions. User sees a generic error page, not a recoverable message. |

---

## Top 3 Highest-Risk Items

### 1. No API error recovery
AI calls (`generateCoaching`) have no retry, timeout, or circuit-breaker. A slow or failing Anthropic API blocks the user with no feedback. **Mitigation**: Add a timeout wrapper (10s) and a user-facing "AI is temporarily unavailable" fallback.

### 2. No environment validation at startup
Missing `ANTHROPIC_API_KEY` or `DATABASE_URL` causes runtime crashes deep in the call stack. **Mitigation**: Add a `checkEnv()` call in `next.config.js` or a root layout server component that fails fast with clear messages.

### 3. Timezone-sensitive trend computation
`getLedgerData` groups entries by `toISOString().slice(0, 10)` (UTC date). Users in UTC−8 could see today's entries appear under "tomorrow" in the trend chart. **Mitigation**: Either normalize to UTC consistently (document this) or pass the user's timezone and format dates accordingly.

---

## Summary

The core coaching pipeline, safety layer, and ledger system are well-tested and structurally sound. The primary gaps are operational: environment setup, API resilience, and timezone handling. These are standard pre-deployment concerns — none require architectural changes.
