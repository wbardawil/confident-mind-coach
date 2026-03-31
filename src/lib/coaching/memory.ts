import { Prisma } from "@prisma/client";
import { db } from "@/lib/utils/db";

/**
 * Build a coaching memory snapshot for the AI coach.
 *
 * Aggregates recent activity across all coaching flows into a concise
 * text block suitable for injection into the system prompt.
 * Budget target: ~3,000 tokens (~12K chars).
 */
export async function getCoachingMemory(userId: string): Promise<string> {
  const [
    recentEsp,
    recentAar,
    recentCoachingSessions,
    pastChatSessions,
    ledgerSummary,
    recentAffirmations,
    documents,
  ] = await Promise.all([
    // Last 5 ESP entries
    db.eSPEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { effort: true, success: true, progress: true, createdAt: true },
    }),

    // Last 3 AAR entries
    db.aAREntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { whatHappened: true, soWhat: true, nowWhat: true, createdAt: true },
    }),

    // Last 5 structured coaching sessions (ESP/Pregame/Reset/AAR reflections)
    db.coachingSession.findMany({
      where: {
        userId,
        flagged: false,
        NOT: { outputJson: { equals: Prisma.DbNull } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { mode: true, outputJson: true, createdAt: true },
    }),

    // Last 5 past chat sessions (titles + last assistant message as summary)
    db.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        messages: {
          where: { role: "assistant" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    }),

    // Ledger summary: total deposits, withdrawals, net score
    db.ledgerEntry.findMany({
      where: { userId },
      select: { type: true, scoreDelta: true },
    }),

    // Last 5 active affirmations
    db.affirmation.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { text: true, source: true },
    }),

    // Uploaded documents (extracted content, truncated)
    db.userDocument.findMany({
      where: { userId },
      select: { fileName: true, category: true, extractedContent: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const sections: string[] = [];

  // ── Past chat sessions ──
  if (pastChatSessions.length > 0) {
    const lines = pastChatSessions.map((s) => {
      const date = s.updatedAt.toISOString().slice(0, 10);
      const lastMsg = s.messages[0]?.content;
      const summary = lastMsg
        ? lastMsg.slice(0, 200) + (lastMsg.length > 200 ? "..." : "")
        : "No summary";
      return `- [${date}] "${s.title ?? "Untitled"}" — ${summary}`;
    });
    sections.push(`## Recent coaching conversations\n\n${lines.join("\n")}`);
  }

  // ── Recent ESP reflections ──
  if (recentEsp.length > 0) {
    const lines = recentEsp.map((e) => {
      const date = e.createdAt.toISOString().slice(0, 10);
      return `- [${date}] Effort: ${truncate(e.effort, 80)} | Success: ${truncate(e.success, 80)} | Progress: ${truncate(e.progress, 80)}`;
    });
    sections.push(`## Recent daily ESP reflections\n\n${lines.join("\n")}`);
  }

  // ── Recent AARs ──
  if (recentAar.length > 0) {
    const lines = recentAar.map((a) => {
      const date = a.createdAt.toISOString().slice(0, 10);
      return `- [${date}] What happened: ${truncate(a.whatHappened, 80)} | So what: ${truncate(a.soWhat, 80)} | Now what: ${truncate(a.nowWhat, 80)}`;
    });
    sections.push(`## Recent After Action Reviews\n\n${lines.join("\n")}`);
  }

  // ── AI coaching reflections ──
  if (recentCoachingSessions.length > 0) {
    const lines = recentCoachingSessions.map((s) => {
      const date = s.createdAt.toISOString().slice(0, 10);
      const output = s.outputJson as Record<string, unknown> | null;
      const reflection = typeof output?.reflection === "string"
        ? truncate(output.reflection, 150)
        : "N/A";
      return `- [${date}] ${s.mode}: ${reflection}`;
    });
    sections.push(`## Recent coaching feedback given\n\n${lines.join("\n")}`);
  }

  // ── Active affirmations ──
  if (recentAffirmations.length > 0) {
    const lines = recentAffirmations.map(
      (a) => `- (${a.source}) "${a.text}"`,
    );
    sections.push(`## Active affirmations\n\n${lines.join("\n")}`);
  }

  // ── Confidence ledger summary ──
  if (ledgerSummary.length > 0) {
    let deposits = 0;
    let withdrawals = 0;
    let netScore = 0;
    for (const entry of ledgerSummary) {
      const delta = entry.scoreDelta ?? 0;
      netScore += delta;
      if (entry.type === "DEPOSIT") deposits++;
      else if (entry.type === "WITHDRAWAL") withdrawals++;
    }
    sections.push(
      `## Confidence ledger summary\n\n- Total deposits: ${deposits}\n- Total withdrawals: ${withdrawals}\n- Net confidence score: ${netScore > 0 ? "+" : ""}${netScore}`,
    );
  }

  // ── Uploaded documents ──
  if (documents.length > 0) {
    const docLines = documents.map((doc) => {
      // Cap each document at ~2000 chars in memory context
      const content = truncate(doc.extractedContent, 2000);
      return `### ${doc.category.toUpperCase()}: ${doc.fileName}\n\n${content}`;
    });
    sections.push(`## User-uploaded documents\n\n${docLines.join("\n\n")}`);
  }

  if (sections.length === 0) return "";

  return sections.join("\n\n");
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}
