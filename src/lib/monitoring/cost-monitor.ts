/**
 * Cost monitoring utilities.
 *
 * Provides per-user and system-wide cost tracking via the UsageLog table.
 * All functions are read-only queries — no side effects.
 */

import { db } from "@/lib/utils/db";

function utcMidnightToday(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get a user's total AI cost (in cents) for today (UTC).
 */
export async function getUserDailyCost(userId: string): Promise<number> {
  const dayStart = utcMidnightToday();
  const result = await db.usageLog.aggregate({
    where: { userId, createdAt: { gte: dayStart } },
    _sum: { costCents: true },
  });
  return result._sum.costCents ?? 0;
}

/**
 * Get a user's total AI cost (in cents) for the current calendar month.
 */
export async function getUserMonthlyCost(userId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const result = await db.usageLog.aggregate({
    where: { userId, createdAt: { gte: monthStart } },
    _sum: { costCents: true },
  });
  return result._sum.costCents ?? 0;
}

/**
 * Get system-wide total AI cost (in cents) for today (UTC).
 */
export async function getSystemDailyCost(): Promise<number> {
  const dayStart = utcMidnightToday();
  const result = await db.usageLog.aggregate({
    where: { createdAt: { gte: dayStart } },
    _sum: { costCents: true },
  });
  return result._sum.costCents ?? 0;
}

/**
 * Check if a user's daily cost is anomalous (>2x their 7-day average).
 */
export async function checkCostAnomaly(userId: string): Promise<{
  anomalous: boolean;
  todayCents: number;
  avgCents: number;
}> {
  const dayStart = utcMidnightToday();
  const weekAgo = new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayResult, weekResult] = await Promise.all([
    db.usageLog.aggregate({
      where: { userId, createdAt: { gte: dayStart } },
      _sum: { costCents: true },
    }),
    db.usageLog.aggregate({
      where: { userId, createdAt: { gte: weekAgo, lt: dayStart } },
      _sum: { costCents: true },
    }),
  ]);

  const todayCents = todayResult._sum.costCents ?? 0;
  const weekCents = weekResult._sum.costCents ?? 0;
  const avgCents = weekCents / 7;

  return {
    anomalous: avgCents > 0 && todayCents > avgCents * 2,
    todayCents,
    avgCents,
  };
}
