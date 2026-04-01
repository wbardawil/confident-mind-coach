"use server";

import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";

/**
 * Sync the user's browser-detected timezone to their profile.
 * Called once on app load from a client component.
 */
export async function syncTimezone(timezone: string) {
  // Validate it's a real IANA timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    return;
  }

  const user = await getCurrentUser();
  if (!user?.profile) return;

  // Only update if changed
  if (user.profile.timezone === timezone) return;

  await db.profile.update({
    where: { id: user.profile.id },
    data: { timezone },
  });
}
