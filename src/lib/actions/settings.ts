"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { isClerkConfigured } from "@/lib/utils/auth";
import { settingsInputSchema, type SettingsInput } from "@/lib/validators/settings";
import { ROUTES } from "@/lib/utils/constants";

/** Sentinel clerkId used by the dev fallback in getCurrentUser. */
const DEV_CLERK_ID = "dev_user_local";

export interface UserSettings {
  displayName: string | null;
  email: string;
  isClerkManaged: boolean;
  /** True when running with the local dev fallback user (no real auth). */
  isDevAccount: boolean;
  role: string | null;
  performanceDomain: string | null;
  strengths: string[];
  confidenceChallenges: string[];
  baselineScore: number | null;
  coachModel: string;
  language: string;
  timezone: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  memberSince: Date;
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = user.profile;

  const isDevAccount = user.clerkId === DEV_CLERK_ID;

  return {
    displayName: user.name ?? null,
    email: user.email,
    isClerkManaged: isClerkConfigured(),
    isDevAccount,
    role: profile?.role ?? null,
    performanceDomain: profile?.performanceDomain ?? null,
    strengths: profile?.strengths ?? [],
    confidenceChallenges: profile?.confidenceChallenges ?? [],
    baselineScore: profile?.baselineScore ?? null,
    coachModel: profile?.coachModel ?? "haiku-4.5",
    language: profile?.language ?? "English",
    timezone: profile?.timezone ?? "UTC",
    subscriptionTier: user.subscriptionTier ?? "free",
    subscriptionStatus: user.subscriptionStatus ?? null,
    memberSince: user.createdAt,
  };
}

export type UpdateSettingsResult =
  | { success: true }
  | { success: false; error: string };

export async function updateSettings(
  data: SettingsInput,
): Promise<UpdateSettingsResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const parsed = settingsInputSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Please check your inputs and try again." };
  }

  const input = parsed.data;

  // Update user name (empty string → null in DB)
  await db.user.update({
    where: { id: user.id },
    data: { name: input.displayName || null },
  });

  // Upsert profile (should always exist after onboarding, but be safe)
  await db.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      role: input.role,
      performanceDomain: input.performanceDomain,
      baselineScore: input.baselineScore,
      coachModel: input.coachModel,
      language: input.language,
      strengths: input.strengths,
      confidenceChallenges: input.confidenceChallenges,
      recurringTriggers: [],
      onboardingCompleted: false,
    },
    update: {
      role: input.role,
      performanceDomain: input.performanceDomain,
      baselineScore: input.baselineScore,
      coachModel: input.coachModel,
      language: input.language,
      strengths: input.strengths,
      confidenceChallenges: input.confidenceChallenges,
    },
  });

  revalidatePath(ROUTES.SETTINGS);
  revalidatePath(ROUTES.DASHBOARD);

  return { success: true };
}
