/**
 * UTC date helpers for ledger and trend calculations.
 *
 * All date boundaries use UTC to avoid timezone and DST drift.
 * PostgreSQL stores `timestamptz` in UTC, and `toISOString()` also
 * formats in UTC — so using UTC here keeps everything consistent.
 */

/**
 * Returns a Date representing UTC midnight N days ago.
 *
 * Uses only UTC methods so the result is independent of the
 * server's local timezone and unaffected by DST transitions.
 */
export function utcDaysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Extract the UTC date key (YYYY-MM-DD) from a Date.
 *
 * Equivalent to `d.toISOString().slice(0, 10)` but makes the
 * intent explicit: we are always grouping by UTC date.
 */
export function toUTCDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
