"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { onboardingSchema, type OnboardingInput } from "@/lib/validators/onboarding";

export async function saveOnboarding(data: OnboardingInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: "Validation failed" };

  await db.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      role: parsed.data.role,
      performanceDomain: parsed.data.performanceDomain,
      strengths: parsed.data.strengths,
      confidenceChallenges: parsed.data.confidenceChallenges,
      recurringTriggers: parsed.data.recurringTriggers,
      baselineScore: parsed.data.baselineScore,
      onboardingCompleted: true,
    },
    update: {
      role: parsed.data.role,
      performanceDomain: parsed.data.performanceDomain,
      strengths: parsed.data.strengths,
      confidenceChallenges: parsed.data.confidenceChallenges,
      recurringTriggers: parsed.data.recurringTriggers,
      baselineScore: parsed.data.baselineScore,
      onboardingCompleted: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  return { success: true as const };
}
