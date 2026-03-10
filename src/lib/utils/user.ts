import { db } from "@/lib/utils/db";
import { isClerkConfigured } from "@/lib/utils/auth";

/**
 * Get or create the current user in the database.
 *
 * - When Clerk is configured: reads the Clerk session, upserts a User row.
 * - When Clerk is NOT configured (local dev): uses a static dev user so the
 *   app remains functional without valid Clerk keys.
 *
 * Returns the User with their Profile included, or null if unauthenticated.
 */
export async function getCurrentUser() {
  const clerkReady = isClerkConfigured();

  if (clerkReady) {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    const email =
      clerkUser?.emailAddresses[0]?.emailAddress ?? "unknown@example.com";

    return db.user.upsert({
      where: { clerkId: userId },
      create: { clerkId: userId, email },
      update: { email },
      include: { profile: true },
    });
  }

  // Dev mode: static local user
  return db.user.upsert({
    where: { clerkId: "dev_user_local" },
    create: { clerkId: "dev_user_local", email: "dev@localhost" },
    update: {},
    include: { profile: true },
  });
}
