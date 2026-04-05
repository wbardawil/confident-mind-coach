"use server";

import { db } from "@/lib/utils/db";
import { getCurrentUser } from "@/lib/utils/user";

export interface ChatSessionSummary {
  id: string;
  title: string | null;
  preview: string;
  createdAt: string; // ISO string for safe serialization
  updatedAt: string;
  messageCount: number;
}

/**
 * List all chat sessions for the current user, most recent first.
 * Returns a preview (first user message) for each.
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
    .filter((s) => s._count.messages > 0) // skip empty sessions
    .map((s) => ({
      id: s.id,
      title: s.title,
      preview: s.messages[0]?.content.slice(0, 120) ?? "",
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      messageCount: s._count.messages,
    }));
}
