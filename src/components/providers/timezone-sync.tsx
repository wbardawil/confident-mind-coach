"use client";

import { useEffect } from "react";
import { syncTimezone } from "@/lib/actions/timezone";

/**
 * Auto-detects the user's browser timezone and syncs it to their profile.
 * Runs once on mount. No UI rendered.
 */
export function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      syncTimezone(tz);
    }
  }, []);

  return null;
}
