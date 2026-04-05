"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { visionSchema, visionUpdateSchema, type VisionInput, type VisionUpdateInput } from "@/lib/validators/vision";
import { generateGapAnalysis } from "@/lib/coaching/vision";
import { ROUTES } from "@/lib/utils/constants";

const MAX_VISION_DOMAINS = 10;

// ─── Create ──────────────────────────────────────

export async function createVision(data: VisionInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = visionSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return { success: false as const, error: firstError ?? "Please check your inputs." };
  }

  const { domain, customLabel, vision: visionText, currentState } = parsed.data;

  // Check for duplicate: preset domains are unique; custom domains unique by label
  const existing = await db.visionDomain.findFirst({
    where: {
      userId: user.id,
      domain,
      customLabel: domain === "custom" ? (customLabel ?? null) : null,
    },
  });
  if (existing) {
    return { success: false as const, error: "You already have a vision for this domain. Edit it instead." };
  }

  // Check limit
  const count = await db.visionDomain.count({ where: { userId: user.id } });
  if (count >= MAX_VISION_DOMAINS) {
    return { success: false as const, error: `You can have up to ${MAX_VISION_DOMAINS} vision domains.` };
  }

  const vision = await db.visionDomain.create({
    data: {
      userId: user.id,
      domain,
      customLabel: domain === "custom" ? (customLabel ?? null) : null,
      vision: visionText,
      currentState: currentState || null,
      priority: count, // next in order
    },
  });

  // Fire-and-forget gap analysis if current state provided
  if (currentState) {
    const domainLabel = domain === "custom" && customLabel ? customLabel : domain;
    generateGapAnalysis(
      vision.id,
      domainLabel,
      visionText,
      currentState,
    ).catch(() => {});
  }

  revalidatePath(ROUTES.VISION);
  revalidatePath(ROUTES.GOALS);
  return { success: true as const };
}

// ─── Update ──────────────────────────────────────

export async function updateVision(id: string, data: VisionUpdateInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const parsed = visionUpdateSchema.safeParse(data);
  if (!parsed.success) return { success: false as const, error: "Please check your inputs." };

  const existing = await db.visionDomain.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return { success: false as const, error: "Not found" };

  await db.visionDomain.update({
    where: { id },
    data: {
      vision: parsed.data.vision,
      currentState: parsed.data.currentState || null,
      gap: null, // clear old gap analysis on edit
    },
  });

  // Regenerate gap analysis if current state provided
  if (parsed.data.currentState) {
    generateGapAnalysis(
      id,
      existing.domain,
      parsed.data.vision,
      parsed.data.currentState,
    ).catch(() => {});
  }

  revalidatePath(ROUTES.VISION);
  return { success: true as const };
}

// ─── Read ────────────────────────────────────────

export async function getVisions() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.visionDomain.findMany({
    where: { userId: user.id },
    orderBy: { priority: "asc" },
  });
}

// ─── Delete ──────────────────────────────────────

export async function deleteVision(id: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const existing = await db.visionDomain.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return { success: false as const, error: "Not found" };

  await db.visionDomain.delete({ where: { id } });

  revalidatePath(ROUTES.VISION);
  revalidatePath(ROUTES.GOALS);
  return { success: true as const };
}
