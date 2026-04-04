"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { systemSchema, type SystemInput } from "@/lib/validators/systems";
import { proposeSystemsForGoal, type ProposedSystem } from "@/lib/coaching/systems";
import { ROUTES } from "@/lib/utils/constants";

// ─── Propose systems via AI ──────────────────────

export async function proposeSystems(
  goalId: string,
): Promise<
  | { success: true; systems: ProposedSystem[] }
  | { success: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const goal = await db.confidenceGoal.findFirst({
    where: { id: goalId, userId: user.id },
    select: { title: true, description: true, category: true },
  });
  if (!goal) return { success: false, error: "Goal not found" };

  return proposeSystemsForGoal(
    user.id,
    goal.title,
    goal.description,
    goal.category,
  );
}

// ─── Accept a proposed system ────────────────────

export async function acceptSystem(
  goalId: string,
  data: SystemInput,
) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = systemSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: "Validation failed" };

  // Verify goal ownership
  const goal = await db.confidenceGoal.findFirst({
    where: { id: goalId, userId: user.id },
  });
  if (!goal) return { success: false as const, error: "Goal not found" };

  await db.goalSystem.create({
    data: {
      goalId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      frequency: parsed.data.frequency,
      source: "ai",
    },
  });

  revalidatePath(ROUTES.GOALS);
  return { success: true as const };
}

// ─── Create a user-defined system ────────────────

export async function createSystem(
  goalId: string,
  data: SystemInput,
) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = systemSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: "Validation failed" };

  const goal = await db.confidenceGoal.findFirst({
    where: { id: goalId, userId: user.id },
  });
  if (!goal) return { success: false as const, error: "Goal not found" };

  await db.goalSystem.create({
    data: {
      goalId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      frequency: parsed.data.frequency,
      source: "user",
    },
  });

  revalidatePath(ROUTES.GOALS);
  return { success: true as const };
}

// ─── Update a system ─────────────────────────────

export async function updateSystem(systemId: string, data: SystemInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = systemSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: "Validation failed" };

  const system = await db.goalSystem.findFirst({
    where: { id: systemId },
    include: { goal: { select: { userId: true } } },
  });
  if (!system || system.goal.userId !== user.id) {
    return { success: false as const, error: "Not found" };
  }

  await db.goalSystem.update({
    where: { id: systemId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      frequency: parsed.data.frequency,
    },
  });

  revalidatePath(ROUTES.GOALS);
  return { success: true as const };
}

// ─── Mark system done today ──────────────────────

export async function completeSystem(systemId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const system = await db.goalSystem.findFirst({
    where: { id: systemId },
    include: { goal: { select: { userId: true } } },
  });
  if (!system || system.goal.userId !== user.id) {
    return { success: false as const, error: "Not found" };
  }

  // Calculate streak: if last done was yesterday (or today), increment. Otherwise reset to 1.
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = 1;
  if (system.lastDoneAt) {
    const lastDate = new Date(
      system.lastDoneAt.getFullYear(),
      system.lastDoneAt.getMonth(),
      system.lastDoneAt.getDate(),
    );
    if (lastDate.getTime() === today.getTime()) {
      // Already done today — no change
      return { success: true as const, alreadyDone: true };
    }
    if (lastDate.getTime() === yesterday.getTime()) {
      newStreak = system.streak + 1;
    }
  }

  await db.goalSystem.update({
    where: { id: systemId },
    data: {
      streak: newStreak,
      lastDoneAt: now,
    },
  });

  revalidatePath(ROUTES.GOALS);
  return { success: true as const, streak: newStreak };
}

// ─── Pause / resume / delete ─────────────────────

export async function updateSystemStatus(
  systemId: string,
  status: "active" | "paused" | "completed",
) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const system = await db.goalSystem.findFirst({
    where: { id: systemId },
    include: { goal: { select: { userId: true } } },
  });
  if (!system || system.goal.userId !== user.id) {
    return { success: false as const, error: "Not found" };
  }

  await db.goalSystem.update({
    where: { id: systemId },
    data: { status },
  });

  revalidatePath(ROUTES.GOALS);
  return { success: true as const };
}

export async function deleteSystem(systemId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const system = await db.goalSystem.findFirst({
    where: { id: systemId },
    include: { goal: { select: { userId: true } } },
  });
  if (!system || system.goal.userId !== user.id) {
    return { success: false as const, error: "Not found" };
  }

  await db.goalSystem.delete({ where: { id: systemId } });

  revalidatePath(ROUTES.GOALS);
  return { success: true as const };
}

// ─── Get systems for a goal ──────────────────────

export async function getGoalSystems(goalId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const goal = await db.confidenceGoal.findFirst({
    where: { id: goalId, userId: user.id },
  });
  if (!goal) return [];

  return db.goalSystem.findMany({
    where: { goalId },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
}
