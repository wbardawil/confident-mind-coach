"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { getChallengeBySlug } from "@/lib/challenges/registry";
import { generateCoaching } from "@/lib/ai/client";
import { LEDGER_TYPES, LEDGER_SOURCE_TYPES } from "@/lib/utils/constants";

export async function getEnrollment(challengeSlug: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  return db.challengeEnrollment.findUnique({
    where: { userId_challengeSlug: { userId: user.id, challengeSlug } },
    include: {
      dayEntries: {
        orderBy: { day: "asc" },
      },
    },
  });
}

export async function enrollInChallenge(challengeSlug: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const challenge = getChallengeBySlug(challengeSlug);
  if (!challenge) return { success: false as const, error: "Challenge not found" };

  // Check if already enrolled
  const existing = await db.challengeEnrollment.findUnique({
    where: { userId_challengeSlug: { userId: user.id, challengeSlug } },
  });

  if (existing) {
    // Re-activate if abandoned
    if (existing.status === "abandoned") {
      await db.challengeEnrollment.update({
        where: { id: existing.id },
        data: { status: "active", currentDay: 1 },
      });
      revalidatePath(`/challenges/${challengeSlug}`);
      return { success: true as const };
    }
    return { success: true as const }; // already enrolled
  }

  await db.challengeEnrollment.create({
    data: {
      userId: user.id,
      challengeSlug,
    },
  });

  revalidatePath(`/challenges/${challengeSlug}`);
  return { success: true as const };
}

export async function submitChallengeDay(
  challengeSlug: string,
  day: number,
  reflection: string,
) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  if (!reflection.trim()) {
    return { success: false as const, error: "Share your reflection to continue" };
  }

  const challenge = getChallengeBySlug(challengeSlug);
  if (!challenge) return { success: false as const, error: "Challenge not found" };

  const dayConfig = challenge.days.find((d) => d.day === day);
  if (!dayConfig) return { success: false as const, error: "Invalid day" };

  const enrollment = await db.challengeEnrollment.findUnique({
    where: { userId_challengeSlug: { userId: user.id, challengeSlug } },
  });
  if (!enrollment || enrollment.status !== "active") {
    return { success: false as const, error: "Not enrolled" };
  }

  // Check if already completed this day
  const existingEntry = await db.challengeDayEntry.findFirst({
    where: { enrollmentId: enrollment.id, day },
  });
  if (existingEntry) {
    return { success: true as const, aiResponse: existingEntry.aiResponse };
  }

  // Build prompt for AI coaching on this day's reflection
  const profile = user.profile;
  const profileContext = profile
    ? `This person is a ${profile.role} in ${profile.performanceDomain}. Strengths: ${profile.strengths.join(", ")}.`
    : "";

  const language = profile?.language;
  const languageInstruction =
    language && language !== "English"
      ? `\nIMPORTANT: Respond entirely in ${language}.`
      : "";

  const systemPrompt = `You are a mental performance coach running a structured challenge: "${challenge.title}".

${profileContext}

Today is Day ${day} of ${challenge.duration}: "${dayConfig.title}" (Theme: ${dayConfig.theme})

Today's micro-lesson: ${dayConfig.lesson}

The user was asked: "${dayConfig.prompt}"

Your coaching instructions for this day: ${dayConfig.aiInstruction}

Respond with 3-5 sentences of personalized coaching. Be warm, specific, and grounded in their actual words. End with encouragement for tomorrow.${languageInstruction}`;

  let aiResponse: string;
  try {
    aiResponse = await generateCoaching({
      systemPrompt,
      userMessage: reflection,
    });
  } catch {
    aiResponse = "Great reflection. Keep building on this tomorrow.";
  }

  // Persist day entry, advance enrollment, and create ledger deposit
  const isLastDay = day >= challenge.duration;

  await db.$transaction([
    db.challengeDayEntry.create({
      data: {
        enrollmentId: enrollment.id,
        day,
        reflection,
        aiResponse,
      },
    }),
    db.challengeEnrollment.update({
      where: { id: enrollment.id },
      data: {
        currentDay: isLastDay ? day : day + 1,
        status: isLastDay ? "completed" : "active",
        completedAt: isLastDay ? new Date() : null,
      },
    }),
    db.ledgerEntry.create({
      data: {
        userId: user.id,
        type: LEDGER_TYPES.DEPOSIT,
        title: `${challenge.title} — Day ${day}`,
        description: dayConfig.title,
        scoreDelta: isLastDay ? 5 : 2, // bonus points for completing the challenge
        sourceType: LEDGER_SOURCE_TYPES.ESP, // uses ESP as source type for challenge reflections
      },
    }),
  ]);

  revalidatePath(`/challenges/${challengeSlug}`);
  revalidatePath("/dashboard");
  revalidatePath("/ledger");

  return { success: true as const, aiResponse };
}
