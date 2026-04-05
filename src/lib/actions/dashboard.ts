"use server";

import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { utcDaysAgo, startOfUserDay } from "@/lib/utils/date";

interface RecommendedAction {
  label: string;
  description: string;
  href: string;
}

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const timezone = user.profile?.timezone ?? "UTC";
  const fourteenDaysAgo = utcDaysAgo(14);
  const startOfDay = startOfUserDay(timezone);

  const [
    recentSessions,
    ledgerBalance,
    net14dAggregate,
    recentAffirmations,
    recentEspEntries,
    espToday,
    activeEnrollment,
  ] = await Promise.all([
    db.coachingSession.findMany({
      where: { userId: user.id, flagged: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, mode: true, createdAt: true },
    }),

    db.ledgerEntry.aggregate({
      where: { userId: user.id },
      _sum: { scoreDelta: true },
    }),

    db.ledgerEntry.aggregate({
      where: { userId: user.id, createdAt: { gte: fourteenDaysAgo } },
      _sum: { scoreDelta: true },
    }),

    db.affirmation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, text: true, source: true, createdAt: true },
    }),

    db.eSPEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, effort: true, success: true, progress: true, createdAt: true },
    }),

    // Did the user do ESP today?
    db.eSPEntry.count({
      where: { userId: user.id, createdAt: { gte: startOfDay } },
    }),

    // Active challenge enrollment
    db.challengeEnrollment.findFirst({
      where: { userId: user.id, status: "active" },
      select: {
        challengeSlug: true,
        currentDay: true,
        dayEntries: {
          where: { completedAt: { gte: startOfDay } },
          select: { id: true },
        },
      },
    }),
  ]);

  // Smart recommended action
  const recommendedAction = getRecommendedAction(
    espToday > 0,
    activeEnrollment,
  );

  return {
    userName: user.name ?? user.profile?.role ?? "there",
    timezone: user.profile?.timezone ?? "UTC",
    recentSessions,
    confidenceScore: ledgerBalance._sum.scoreDelta ?? 0,
    net14d: net14dAggregate._sum.scoreDelta ?? 0,
    recentAffirmations,
    recentEspEntries,
    recommendedAction,
  };
}

function getRecommendedAction(
  espDoneToday: boolean,
  activeEnrollment: { challengeSlug: string; currentDay: number; dayEntries: { id: string }[] } | null,
): RecommendedAction {
  // 1. Active challenge with pending day today
  if (activeEnrollment && activeEnrollment.dayEntries.length === 0) {
    return {
      label: `Continue Day ${activeEnrollment.currentDay}`,
      description: "Your challenge is waiting",
      href: `/challenges/${activeEnrollment.challengeSlug}`,
    };
  }

  // 2. No ESP today
  if (!espDoneToday) {
    return {
      label: "Daily ESP",
      description: "Make your first confidence deposit today",
      href: "/daily-esp",
    };
  }

  // 3. ESP done, challenge done or none — talk to coach
  return {
    label: "Talk to your coach",
    description: "Reflect on today with your coach",
    href: "/coach",
  };
}
