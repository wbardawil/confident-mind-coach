/**
 * Format a date with the user's timezone.
 * Works on both server (pass timezone from DB) and client (pass from browser).
 */
export function formatDate(
  date: Date | string,
  timezone: string = "UTC",
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    timeZone: timezone,
    ...options,
  };
  return d.toLocaleDateString("en-US", defaultOptions);
}

export function formatDateTime(
  date: Date | string,
  timezone: string = "UTC",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
}

export function formatDateShort(
  date: Date | string,
  timezone: string = "UTC",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
}
