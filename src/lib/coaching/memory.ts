import { Prisma } from "@prisma/client";
import { db } from "@/lib/utils/db";
import { getGoalContext } from "@/lib/actions/goals";

/**
 * Memory depth by subscription tier.
 * Higher tiers get deeper history = smarter coach.
 */
const MEMORY_DEPTH = {
  free: { sessions: 3, esp: 5, aar: 3, journal: 5 },
  pro: { sessions: 15, esp: 20, aar: 10, journal: 30 },
  elite: { sessions: 30, esp: 50, aar: 20, journal: 100 },
} as const;

type MemoryTier = keyof typeof MEMORY_DEPTH;

/**
 * Build a coaching memory snapshot for the AI coach.
 *
 * Aggregates recent activity, coaching journal notes, and syntheses
 * into a rich context block. Depth scales with subscription tier.
 */
export async function getCoachingMemory(userId: string, tier?: string): Promise<string> {
  const depth = MEMORY_DEPTH[(tier as MemoryTier) ?? "free"] ?? MEMORY_DEPTH.free;

  const [
    recentEsp,
    recentAar,
    recentCoachingSessions,
    pastChatSessions,
    ledgerSummary,
    recentAffirmations,
    documents,
    goalContext,
    journalNotes,
    journalSyntheses,
  ] = await Promise.all([
    // ESP entries (depth by tier)
    db.eSPEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: depth.esp,
      select: { effort: true, success: true, progress: true, createdAt: true },
    }),

    // AAR entries (depth by tier)
    db.aAREntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: depth.aar,
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

    // Past chat sessions (depth by tier)
    db.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: depth.sessions,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20,
          select: { role: true, content: true },
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

    // Active confidence goals
    getGoalContext(userId),

    // Coaching journal: session notes (depth by tier)
    db.coachingJournal.findMany({
      where: {
        userId,
        type: { in: ["session", "esp", "reset", "pregame", "aar", "challenge"] },
      },
      orderBy: { createdAt: "desc" },
      take: depth.journal,
      select: { type: true, content: true, createdAt: true },
    }),

    // Coaching journal: syntheses (weekly, monthly, quarterly — all time)
    db.coachingJournal.findMany({
      where: {
        userId,
        type: { in: ["weekly", "monthly", "quarterly"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { type: true, content: true, period: true, createdAt: true },
    }),
  ]);

  const sections: string[] = [];

  // ── Past chat sessions (summarized for relevance) ──
  if (pastChatSessions.length > 0) {
    const sessionBlocks = pastChatSessions.map((s) => {
      const date = s.updatedAt.toISOString().slice(0, 10);
      const title = s.title ?? "Untitled";

      if (s.messages.length === 0) return `- [${date}] "${title}" — (empty session)`;

      return `### [${date}] "${title}"\n\n${summarizeSession(s.messages)}`;
    });

    sections.push(
      `## Your past conversations with this person\n\n${sessionBlocks.join("\n\n---\n\n")}`,
    );
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

  // ── Active confidence goals ──
  if (goalContext) {
    sections.push(goalContext);
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

  // ── Coaching journal: syntheses (highest signal, longest memory) ──
  if (journalSyntheses.length > 0) {
    const synthLines = journalSyntheses.map((s) => {
      const label = s.type === "quarterly" ? "QUARTERLY" : s.type === "monthly" ? "MONTHLY" : "WEEKLY";
      return `### ${label} [${s.period ?? s.createdAt.toISOString().slice(0, 10)}]\n${s.content}`;
    });
    sections.push(`## Your coaching journal — long-term patterns\n\nThese are your own notes about this person, synthesized over time. Use them to see the bigger arc of their confidence journey.\n\n${synthLines.join("\n\n---\n\n")}`);
  }

  // ── Coaching journal: session notes (recent observations) ──
  if (journalNotes.length > 0) {
    const noteLines = journalNotes.map((n) => {
      const date = n.createdAt.toISOString().slice(0, 10);
      return `- [${date}] (${n.type}) ${truncate(n.content, 300)}`;
    });
    sections.push(`## Your recent session notes\n\n${noteLines.join("\n")}`);
  }

  if (sections.length === 0) return "";

  return sections.join("\n\n");
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

/**
 * Summarize a chat session preserving the actual conversation flow.
 * Includes all user messages and key coach responses so the AI coach
 * can recall what was actually discussed.
 */
function summarizeSession(
  messages: Array<{ role: string; content: string }>,
): string {
  const lines: string[] = [];

  for (const m of messages) {
    const label = m.role === "user" ? "User" : "Coach";
    // Keep messages substantial — 600 chars each to preserve real content
    lines.push(`**${label}:** ${truncate(m.content, 600)}`);
  }

  return lines.join("\n\n");
}
