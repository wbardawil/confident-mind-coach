"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import {
  achievementSchema,
  type AchievementInput,
} from "@/lib/validators/top-ten";

export async function getAchievements() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.achievement.findMany({
    where: { userId: user.id },
    orderBy: [{ rank: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
  });
}

export async function createAchievement(data: AchievementInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = achievementSchema.safeParse(data);
  if (!parsed.success)
    return { success: false as const, error: "Validation failed" };

  const count = await db.achievement.count({ where: { userId: user.id } });
  if (count >= 10)
    return {
      success: false as const,
      error: "Maximum 10 achievements reached",
    };

  await db.achievement.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      evidence: parsed.data.evidence,
      occurredAt: parsed.data.occurredAt
        ? new Date(parsed.data.occurredAt)
        : null,
      rank: parsed.data.rank ?? null,
    },
  });

  revalidatePath("/top-ten");
  return { success: true as const };
}

export async function updateAchievement(id: string, data: AchievementInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = achievementSchema.safeParse(data);
  if (!parsed.success)
    return { success: false as const, error: "Validation failed" };

  const existing = await db.achievement.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id)
    return { success: false as const, error: "Not found" };

  await db.achievement.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      evidence: parsed.data.evidence,
      occurredAt: parsed.data.occurredAt
        ? new Date(parsed.data.occurredAt)
        : null,
      rank: parsed.data.rank ?? null,
    },
  });

  revalidatePath("/top-ten");
  return { success: true as const };
}

export async function deleteAchievement(id: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const existing = await db.achievement.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id)
    return { success: false as const, error: "Not found" };

  await db.achievement.delete({ where: { id } });

  revalidatePath("/top-ten");
  return { success: true as const };
}
