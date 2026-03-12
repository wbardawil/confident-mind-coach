"use server";

import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";

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
        where: { userId: user.id, type: "DEPOSIT" },
      }),

      // Withdrawal count
      db.ledgerEntry.count({
        where: { userId: user.id, type: "WITHDRAWAL" },
      }),

      // Net change over last 14 days
      db.ledgerEntry.aggregate({
        where: {
          userId: user.id,
          createdAt: { gte: daysAgo(14) },
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
          createdAt: { gte: daysAgo(14) },
        },
        orderBy: { createdAt: "asc" },
        select: {
          scoreDelta: true,
          createdAt: true,
        },
      }),
    ]);

  // Build daily trend: group by date, compute running cumulative
  const dailyMap = new Map<string, number>();
  for (const entry of trendEntries) {
    const day = entry.createdAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + (entry.scoreDelta ?? 0));
  }

  // Fill in all 14 days (including days with no entries) for a smooth chart
  const trend: { date: string; cumulative: number }[] = [];

  // Get the running total BEFORE the 14-day window
  const preWindowAggregate = await db.ledgerEntry.aggregate({
    where: {
      userId: user.id,
      createdAt: { lt: daysAgo(14) },
    },
    _sum: { scoreDelta: true },
  });
  let running = preWindowAggregate._sum.scoreDelta ?? 0;

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
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

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
