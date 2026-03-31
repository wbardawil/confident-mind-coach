"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";

export async function getDocuments() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.userDocument.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      category: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteDocument(id: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const existing = await db.userDocument.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return { success: false as const, error: "Not found" };
  }

  await db.userDocument.delete({ where: { id } });

  revalidatePath("/settings");
  return { success: true as const };
}

/**
 * Get all document contents for a user, for use in coaching prompts.
 * Returns a condensed format suitable for AI context injection.
 */
export async function getDocumentContext(userId: string): Promise<string> {
  const docs = await db.userDocument.findMany({
    where: { userId },
    select: {
      fileName: true,
      category: true,
      extractedContent: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (docs.length === 0) return "";

  return docs
    .map(
      (doc) =>
        `--- ${doc.category.toUpperCase()}: ${doc.fileName} ---\n${doc.extractedContent}`
    )
    .join("\n\n");
}
