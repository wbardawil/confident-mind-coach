/**
 * Date helpers for ledger, trend, and timezone-aware calculations.
 *
 * UTC functions are used for database storage and trend grouping.
 * User-timezone functions are used for "today/yesterday" logic,
 * rate limiting, streaks, and date display.
 */

// ─── UTC helpers (for DB storage / trend charts) ──

/**
 * Returns a Date representing UTC midnight N days ago.
 */
export function utcDaysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Extract the UTC date key (YYYY-MM-DD) from a Date.
 */
export function toUTCDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── User-timezone helpers ────────────────────────

/**
 * Get the year, month, day in the user's timezone.
 * Uses Intl.DateTimeFormat which handles DST correctly.
 */
function userDateParts(date: Date, timezone: string): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA formats as YYYY-MM-DD
  const parts = formatter.format(date).split("-");
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  };
}

/**
 * Get the start of "today" (midnight) in the user's timezone,
 * represented as a UTC Date suitable for database queries.
 *
 * Example: If timezone is "America/Mexico_City" (UTC-6) and it's
 * 22:09 on April 3rd local time, this returns 2026-04-03T06:00:00Z
 * (midnight April 3rd in Mexico = 06:00 UTC).
 */
export function startOfUserDay(timezone: string): Date {
  // Create midnight in user's timezone and convert to UTC
  const midnightLocal = new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone }),
  );
  midnightLocal.setHours(0, 0, 0, 0);

  // Calculate the offset between this "local midnight" and UTC
  const now = new Date();
  const nowInTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const offsetMs = nowInTz.getTime() - now.getTime();

  // Midnight in user's timezone expressed as UTC
  const result = new Date(midnightLocal.getTime() - offsetMs);
  return result;
}

/**
 * Get YYYY-MM-DD date key in the user's timezone.
 */
export function toUserDateKey(date: Date, timezone: string): string {
  const { year, month, day } = userDateParts(date, timezone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Check if a date falls on "today" in the user's timezone.
 */
export function isUserToday(date: Date, timezone: string): boolean {
  const now = new Date();
  return toUserDateKey(date, timezone) === toUserDateKey(now, timezone);
}

/**
 * Check if a date falls on "yesterday" in the user's timezone.
 */
export function isUserYesterday(date: Date, timezone: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return toUserDateKey(date, timezone) === toUserDateKey(yesterday, timezone);
}

/**
 * Get N days ago at midnight in the user's timezone, as a UTC Date.
 */
export function userDaysAgo(n: number, timezone: string): Date {
  const start = startOfUserDay(timezone);
  start.setDate(start.getDate() - n);
  return start;
}
