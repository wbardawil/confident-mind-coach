/**
 * Safe numeric coercion utility.
 *
 * Unlike `Number()`, this function:
 * - Returns `undefined` for empty strings and whitespace-only strings
 *   (`Number("")` silently returns `0`, which is a common footgun).
 * - Returns `undefined` for non-numeric strings like `"abc"`.
 * - Returns `undefined` for `NaN`, `Infinity`, `null`, `undefined`,
 *   booleans, objects, and other non-number/non-string types.
 * - Trims string input before parsing.
 * - Returns the original value if it is already a finite number.
 */
export function coerceToNumber(value: unknown): number | undefined {
  // Already a number — but reject NaN and Infinity
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  // String — trim, then reject empty/whitespace
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  // null, undefined, boolean, object, symbol, bigint — all undefined
  return undefined;
}
