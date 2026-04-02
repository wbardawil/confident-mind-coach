import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { getSessionLimit, isModelAllowed, type PlanTier } from "./config";

/**
 * Get the current user's subscription tier.
 */
export async function getUserTier(): Promise<PlanTier> {
  const user = await getCurrentUser();
  if (!user) return "free";
  return (user.subscriptionTier as PlanTier) ?? "free";
}

/**
 * Check if the user has exceeded their daily session limit (free tier only).
 * Counts CoachingSession entries created today.
 */
export async function hasReachedSessionLimit(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return true;

  const tier = (user.subscriptionTier as PlanTier) ?? "free";
  const limit = getSessionLimit(tier);
  if (limit === Infinity) return false;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await db.coachingSession.count({
    where: {
      userId: user.id,
      createdAt: { gte: startOfDay },
    },
  });

  return count >= limit;
}

/**
 * Check if the user can use a specific model.
 */
export async function canUseModel(model: string): Promise<boolean> {
  const tier = await getUserTier();
  return isModelAllowed(tier, model);
}

/**
 * Get the effective model for a user — downgrades to haiku if not allowed.
 */
export function getEffectiveModel(tier: string, preferredModel: string): string {
  if (isModelAllowed(tier, preferredModel)) return preferredModel;
  return "haiku-4.5";
}
