"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { goalSchema, type GoalInput } from "@/lib/validators/goals";

const MAX_GOALS = 5;

export async function getGoals() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.confidenceGoal.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getActiveGoals() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.confidenceGoal.findMany({
    where: { userId: user.id, status: "active" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, category: true, efficacyScore: true },
  });
}

export async function createGoal(data: GoalInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: "Validation failed" };

  const count = await db.confidenceGoal.count({
    where: { userId: user.id, status: "active" },
  });
  if (count >= MAX_GOALS) {
    return { success: false as const, error: `Maximum ${MAX_GOALS} active goals. Achieve or pause one first.` };
  }

  await db.confidenceGoal.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
      efficacyScore: parsed.data.efficacyScore,
    },
  });

  revalidatePath("/goals");
  return { success: true as const };
}

export async function updateGoal(id: string, data: GoalInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = goalSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: "Validation failed" };

  const existing = await db.confidenceGoal.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { success: false as const, error: "Not found" };
  }

  await db.confidenceGoal.update({
    where: { id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      targetDate: parsed.data.targetDate ? new Date(parsed.data.targetDate) : null,
      efficacyScore: parsed.data.efficacyScore,
    },
  });

  revalidatePath("/goals");
  return { success: true as const };
}

export async function updateEfficacyScore(id: string, score: number) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  if (score < 1 || score > 10) return { success: false as const, error: "Score must be 1-10" };

  const existing = await db.confidenceGoal.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { success: false as const, error: "Not found" };
  }

  await db.confidenceGoal.update({
    where: { id },
    data: { efficacyScore: score },
  });

  revalidatePath("/goals");
  return { success: true as const };
}

export async function updateGoalStatus(id: string, status: "active" | "achieved" | "paused") {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const existing = await db.confidenceGoal.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { success: false as const, error: "Not found" };
  }

  await db.confidenceGoal.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/goals");
  return { success: true as const };
}

export async function deleteGoal(id: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const existing = await db.confidenceGoal.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { success: false as const, error: "Not found" };
  }

  await db.confidenceGoal.delete({ where: { id } });

  revalidatePath("/goals");
  return { success: true as const };
}

/**
 * Get goal context for coaching prompts.
 */
export async function getGoalContext(userId: string): Promise<string> {
  const goals = await db.confidenceGoal.findMany({
    where: { userId, status: "active" },
    select: {
      title: true,
      category: true,
      description: true,
      efficacyScore: true,
      targetDate: true,
    },
  });

  if (goals.length === 0) return "";

  const lines = goals.map((g) => {
    const deadline = g.targetDate
      ? ` (target: ${g.targetDate.toISOString().slice(0, 10)})`
      : "";
    const desc = g.description ? ` — ${g.description}` : "";
    return `- [${g.category}] "${g.title}"${desc} | Efficacy: ${g.efficacyScore}/10${deadline}`;
  });

  return `## Active confidence goals\n\nThese are the specific outcomes this person is working toward. All coaching should connect back to these goals when relevant.\n\n${lines.join("\n")}`;
}
