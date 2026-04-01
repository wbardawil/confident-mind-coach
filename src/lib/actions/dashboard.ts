"use server";

import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { utcDaysAgo } from "@/lib/utils/date";

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const fourteenDaysAgo = utcDaysAgo(14);

  const [
    recentSessions,
    ledgerBalance,
    net14dAggregate,
    recentAffirmations,
    recentEspEntries,
  ] = await Promise.all([
    // Recent coaching sessions (all modes, last 5)
    db.coachingSession.findMany({
      where: { userId: user.id, flagged: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        mode: true,
        createdAt: true,
      },
    }),

    // Ledger balance (sum of all scoreDelta)
    db.ledgerEntry.aggregate({
      where: { userId: user.id },
      _sum: { scoreDelta: true },
    }),

    // Net change over last 14 days
    db.ledgerEntry.aggregate({
      where: {
        userId: user.id,
        createdAt: { gte: fourteenDaysAgo },
      },
      _sum: { scoreDelta: true },
    }),

    // Recent affirmations (last 3)
    db.affirmation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        text: true,
        source: true,
        createdAt: true,
      },
    }),

    // Recent ESP entries (last 3)
    db.eSPEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        effort: true,
        success: true,
        progress: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    userName: user.name ?? user.profile?.role ?? "there",
    timezone: user.profile?.timezone ?? "UTC",
    recentSessions,
    confidenceScore: ledgerBalance._sum.scoreDelta ?? 0,
    net14d: net14dAggregate._sum.scoreDelta ?? 0,
    recentAffirmations,
    recentEspEntries,
  };
}
