import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import {
  getSessionLimit,
  getMonthlyMessageCap,
  hasChatAccess,
  isModelAllowed,
  type PlanTier,
} from "./config";

/**
 * Hardcoded bypass until Stripe is configured.
 * TODO: Remove this and use BYPASS_SUBSCRIPTION_GATE env var when ready to enforce subscriptions.
 */
function isBypassed(): boolean {
  return true;
}

/**
 * Get the current user's subscription tier.
 */
export async function getUserTier(): Promise<PlanTier> {
  if (isBypassed()) return "elite";
  const user = await getCurrentUser();
  if (!user) return "free";
  return (user.subscriptionTier as PlanTier) ?? "free";
}

/**
 * Check if the user has exceeded their daily session limit (free tier only).
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

// ─── Chat Message Rate Limiting ─────────────────

/**
 * Get the start of the current billing month (1st of month UTC).
 */
function startOfBillingMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Count chat messages sent by a user this billing month.
 */
export async function getChatMessageCount(userId: string): Promise<number> {
  const since = startOfBillingMonth();

  return db.chatMessage.count({
    where: {
      session: { userId },
      role: "user",
      createdAt: { gte: since },
    },
  });
}

/**
 * Check if the user can send another chat message.
 * Returns { allowed, remaining, cap } for UI display.
 */
export async function checkChatLimit(userId: string, tier: string): Promise<{
  allowed: boolean;
  remaining: number;
  cap: number;
  used: number;
}> {
  if (!hasChatAccess(tier)) {
    return { allowed: false, remaining: 0, cap: 0, used: 0 };
  }

  const cap = getMonthlyMessageCap(tier);
  const used = await getChatMessageCount(userId);
  const remaining = Math.max(0, cap - used);

  return {
    allowed: remaining > 0,
    remaining,
    cap,
    used,
  };
}
