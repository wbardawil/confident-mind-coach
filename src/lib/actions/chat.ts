"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";
import { ROUTES } from "@/lib/utils/constants";

// ─── Types ──────────────────────────────────────

export interface ChatSessionSummary {
  id: string;
  title: string | null;
  preview: string;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ChatFolderData {
  id: string;
  name: string;
  order: number;
}

// ─── Sessions ───────────────────────────────────

/**
 * List all chat sessions for the current user, most recent first.
 */
export async function getChatSessions(): Promise<ChatSessionSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const sessions = await db.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      folderId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
      messages: {
        where: { role: "user" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true },
      },
    },
  });

  return sessions
    .filter((s) => s._count.messages > 0)
    .map((s) => ({
      id: s.id,
      title: s.title,
      folderId: s.folderId,
      preview: s.messages[0]?.content.slice(0, 120) ?? "",
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      messageCount: s._count.messages,
    }));
}

/**
 * Delete a chat session and all its messages.
 */
export async function deleteChatSession(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const session = await db.chatSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) return { success: false as const, error: "Not found" };

  await db.chatSession.delete({ where: { id: sessionId } });

  revalidatePath(ROUTES.COACH);
  return { success: true as const };
}

/**
 * Move a chat session into (or out of) a folder.
 * Pass folderId = null to remove from folder.
 */
export async function moveChatToFolder(sessionId: string, folderId: string | null) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const session = await db.chatSession.findFirst({
    where: { id: sessionId, userId: user.id },
  });
  if (!session) return { success: false as const, error: "Not found" };

  // Verify folder belongs to user (if provided)
  if (folderId) {
    const folder = await db.chatFolder.findFirst({
      where: { id: folderId, userId: user.id },
    });
    if (!folder) return { success: false as const, error: "Folder not found" };
  }

  await db.chatSession.update({
    where: { id: sessionId },
    data: { folderId },
  });

  return { success: true as const };
}

// ─── Folders ────────────────────────────────────

/**
 * List all chat folders for the current user.
 */
export async function getChatFolders(): Promise<ChatFolderData[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const folders = await db.chatFolder.findMany({
    where: { userId: user.id },
    orderBy: { order: "asc" },
    select: { id: true, name: true, order: true },
  });

  return folders;
}

/**
 * Create a new chat folder.
 */
export async function createChatFolder(name: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    return { success: false as const, error: "Folder name must be 1-50 characters" };
  }

  // Check for duplicate
  const existing = await db.chatFolder.findFirst({
    where: { userId: user.id, name: trimmed },
  });
  if (existing) return { success: false as const, error: "Folder already exists" };

  const count = await db.chatFolder.count({ where: { userId: user.id } });
  if (count >= 20) return { success: false as const, error: "Maximum 20 folders" };

  const folder = await db.chatFolder.create({
    data: { userId: user.id, name: trimmed, order: count },
  });

  return { success: true as const, folder: { id: folder.id, name: folder.name, order: folder.order } };
}

/**
 * Rename a chat folder.
 */
export async function renameChatFolder(folderId: string, name: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 50) {
    return { success: false as const, error: "Folder name must be 1-50 characters" };
  }

  const folder = await db.chatFolder.findFirst({
    where: { id: folderId, userId: user.id },
  });
  if (!folder) return { success: false as const, error: "Not found" };

  await db.chatFolder.update({
    where: { id: folderId },
    data: { name: trimmed },
  });

  return { success: true as const };
}

/**
 * Delete a chat folder. Sessions inside are unfoldered (not deleted).
 */
export async function deleteChatFolder(folderId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false as const, error: "Not authenticated" };

  const folder = await db.chatFolder.findFirst({
    where: { id: folderId, userId: user.id },
  });
  if (!folder) return { success: false as const, error: "Not found" };

  // Unfolder sessions first, then delete folder
  await db.chatSession.updateMany({
    where: { folderId },
    data: { folderId: null },
  });

  await db.chatFolder.delete({ where: { id: folderId } });

  return { success: true as const };
}
