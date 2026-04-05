import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/utils/user";
import { db } from "@/lib/utils/db";

export const runtime = "nodejs";

/**
 * GET /api/export — Download all coaching data as JSON.
 *
 * Returns a JSON file containing the user's complete coaching history:
 * sessions, ESP entries, AARs, ledger, goals, vision, achievements.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    profile,
    achievements,
    goals,
    visionDomains,
    espEntries,
    aarEntries,
    ledgerEntries,
    chatSessions,
    memoryFacts,
    affirmations,
    documents,
  ] = await Promise.all([
    db.profile.findUnique({ where: { userId: user.id } }),
    db.achievement.findMany({
      where: { userId: user.id },
      orderBy: { rank: "asc" },
    }),
    db.confidenceGoal.findMany({
      where: { userId: user.id },
    }),
    db.visionDomain.findMany({
      where: { userId: user.id },
      orderBy: { priority: "asc" },
    }),
    db.eSPEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.aAREntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.ledgerEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true, createdAt: true },
        },
      },
    }),
    db.memoryFact.findMany({
      where: { userId: user.id },
      orderBy: { learnedAt: "desc" },
    }),
    db.affirmation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.userDocument.findMany({
      where: { userId: user.id },
      select: { fileName: true, fileType: true, category: true, createdAt: true },
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    },
    profile,
    achievements,
    goals,
    visionDomains,
    espEntries,
    aarEntries,
    ledgerEntries,
    chatSessions: chatSessions.map((s: { id: string; title: string | null; createdAt: Date; updatedAt: Date; messages: { role: string; content: string; createdAt: Date }[] }) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messages: s.messages,
    })),
    memoryFacts,
    affirmations,
    documents,
  };

  const json = JSON.stringify(exportData, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);

  return new Response(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="confident-mind-export-${dateStr}.json"`,
    },
  });
}
