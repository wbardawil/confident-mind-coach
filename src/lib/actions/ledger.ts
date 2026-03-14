"use server";

import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { LEDGER_TYPES } from "@/lib/utils/constants";
import { utcDaysAgo, toUTCDateKey } from "@/lib/utils/date";

export interface LedgerSummary {
  totalScore: number;
  depositCount: number;
  withdrawalCount: number;
  /** Net score change over the last 14 days. */
  net14d: number;
  recentEntries: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    scoreDelta: number | null;
    sourceType: string | null;
    createdAt: Date;
  }[];
  /** Daily running totals for the last 14 days (oldest first). */
  trend: { date: string; cumulative: number }[];
}

export async function getLedgerData(): Promise<LedgerSummary | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const [aggregate, depositCount, withdrawalCount, net14dAggregate, recentEntries, trendEntries] =
    await Promise.all([
      // Total score
      db.ledgerEntry.aggregate({
        where: { userId: user.id },
        _sum: { scoreDelta: true },
      }),

      // Deposit count
      db.ledgerEntry.count({
        where: { userId: user.id, type: LEDGER_TYPES.DEPOSIT },
      }),

      // Withdrawal count
      db.ledgerEntry.count({
        where: { userId: user.id, type: LEDGER_TYPES.WITHDRAWAL },
      }),

      // Net change over last 14 days
      db.ledgerEntry.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: utcDaysAgo(14) },
        },
        _sum: { scoreDelta: true },
      }),

      // Recent entries (last 20)
      db.ledgerEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          scoreDelta: true,
          sourceType: true,
          createdAt: true,
        },
      }),

      // All entries for trend (last 14 days)
      db.ledgerEntry.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: utcDaysAgo(14) },
        },
        orderBy: { createdAt: "asc" },
        select: {
          scoreDelta: true,
          createdAt: true,
        },
      }),
    ]);

  // Build daily trend: group by UTC date, compute running cumulative
  const dailyMap = new Map<string, number>();
  for (const entry of trendEntries) {
    const day = toUTCDateKey(entry.createdAt);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + (entry.scoreDelta ?? 0));
  }

  // Fill in all 14 days (including days with no entries) for a smooth chart
  const trend: { date: string; cumulative: number }[] = [];

  // Get the running total BEFORE the 14-day window
  const preWindowAggregate = await db.ledgerEntry.aggregate({
    where: {
      userId: user.id,
      createdAt: { lt: utcDaysAgo(14) },
    },
    _sum: { scoreDelta: true },
  });
  let running = preWindowAggregate._sum.scoreDelta ?? 0;

  for (let i = 13; i >= 0; i--) {
    const key = toUTCDateKey(utcDaysAgo(i));
    running += dailyMap.get(key) ?? 0;
    trend.push({ date: key, cumulative: running });
  }

  return {
    totalScore: aggregate._sum.scoreDelta ?? 0,
    depositCount,
    withdrawalCount,
    net14d: net14dAggregate._sum.scoreDelta ?? 0,
    recentEntries,
    trend,
  };
}
