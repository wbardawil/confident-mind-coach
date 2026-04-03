"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { extractPersonalityFromDocument } from "@/lib/coaching/personality";
import { ROUTES } from "@/lib/utils/constants";

// ─── Types ───────────────────────────────────────

interface ExtractionSuccess {
  success: true;
  count: number;
}

interface ExtractionNoData {
  success: true;
  count: 0;
  message: string;
}

interface ExtractionError {
  success: false;
  error: string;
}

export type ExtractionResult = ExtractionSuccess | ExtractionNoData | ExtractionError;

// ─── Extract personality from a document ─────────

export async function extractPersonality(documentId: string): Promise<ExtractionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const document = await db.userDocument.findFirst({
    where: { id: documentId, userId: user.id },
    select: { id: true, fileName: true, extractedContent: true },
  });

  if (!document) {
    return { success: false, error: "Document not found" };
  }

  const result = await extractPersonalityFromDocument(
    document.extractedContent,
    document.fileName,
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  if (result.data.noAssessmentFound || result.data.assessments.length === 0) {
    return {
      success: true,
      count: 0,
      message: "No personality assessment data found in this document. Try uploading a DISC, MBTI, StrengthsFinder, or other assessment report.",
    };
  }

  // Delete any existing assessments from this document (re-extraction)
  await db.personalityAssessment.deleteMany({
    where: { userId: user.id, documentId: document.id },
  });

  // Create new assessment records
  await db.$transaction(
    result.data.assessments.map((assessment) =>
      db.personalityAssessment.create({
        data: {
          userId: user.id,
          documentId: document.id,
          framework: assessment.framework,
          label: assessment.label,
          dimensions: assessment.dimensions,
          summary: assessment.summary,
          coachingTips: assessment.coachingTips,
        },
      }),
    ),
  );

  revalidatePath(ROUTES.SETTINGS);
  revalidatePath(ROUTES.DASHBOARD);

  return { success: true, count: result.data.assessments.length };
}

// ─── Read assessments ────────────────────────────

export async function getPersonalityAssessments() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.personalityAssessment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      documentId: true,
      framework: true,
      label: true,
      dimensions: true,
      summary: true,
      coachingTips: true,
      verified: true,
      createdAt: true,
    },
  });
}

// ─── Verify assessment ───────────────────────────

export async function verifyPersonalityAssessment(assessmentId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const assessment = await db.personalityAssessment.findFirst({
    where: { id: assessmentId, userId: user.id },
  });

  if (!assessment) {
    return { success: false, error: "Assessment not found" };
  }

  await db.personalityAssessment.update({
    where: { id: assessmentId },
    data: { verified: true },
  });

  revalidatePath(ROUTES.SETTINGS);
  return { success: true };
}

// ─── Delete assessment ───────────────────────────

export async function deletePersonalityAssessment(assessmentId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const assessment = await db.personalityAssessment.findFirst({
    where: { id: assessmentId, userId: user.id },
  });

  if (!assessment) {
    return { success: false, error: "Assessment not found" };
  }

  await db.personalityAssessment.delete({
    where: { id: assessmentId },
  });

  revalidatePath(ROUTES.SETTINGS);
  return { success: true };
}
