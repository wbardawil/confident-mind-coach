import { Prisma } from "@prisma/client";
import { db } from "@/lib/utils/db";
import { getGoalContext } from "@/lib/actions/goals";
import { getPersonalityContext } from "@/lib/coaching/personality";
import { getVisionContext } from "@/lib/coaching/vision";
import { getSystemsContext } from "@/lib/coaching/systems";
import { getActiveFacts } from "@/lib/coaching/memory-facts";

/**
 * Memory depth by subscription tier.
 * Higher tiers get deeper history = smarter coach.
 */
import { MEMORY_DEPTH_BY_TIER, type PlanTier } from "@/lib/stripe/config";

/**
 * Build a coaching memory snapshot for the AI coach.
 *
 * Aggregates recent activity, coaching journal notes, and syntheses
 * into a rich context block. Depth scales with subscription tier.
 */
export async function getCoachingMemory(userId: string, tier?: string): Promise<string> {
  const depth = MEMORY_DEPTH_BY_TIER[(tier as PlanTier) ?? "free"] ?? MEMORY_DEPTH_BY_TIER.free;

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
    personalityContext,
    visionContext,
    systemsContext,
    memoryFacts,
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

    // Past chat sessions — prefer summaries over raw transcripts
    db.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: depth.sessions,
      select: {
        id: true,
        title: true,
        summary: true,
        updatedAt: true,
        _count: { select: { messages: true } },
        messages: {
          where: { role: "user" },
          orderBy: { createdAt: "asc" },
          take: 3,
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

    // Uploaded documents (capped at 5, truncated to 1000 chars each)
    db.userDocument.findMany({
      where: { userId },
      select: { fileName: true, category: true, extractedContent: true },
      orderBy: { createdAt: "desc" },
      take: 5,
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

    // Structured personality assessment data
    getPersonalityContext(userId),

    // 10x vision context
    getVisionContext(userId),

    // Active systems (daily/weekly actions)
    getSystemsContext(userId),

    // Structured memory facts (Zep-grade, capped at 100)
    getActiveFacts(userId, 100),
  ]);

  const sections: string[] = [];

  // ── Memory facts (PRIMARY memory source — highest fidelity) ──
  if (memoryFacts.length > 0) {
    // Group facts by subject for readability
    const bySubject = new Map<string, string[]>();
    for (const fact of memoryFacts) {
      const key = fact.subject;
      const arr = bySubject.get(key) ?? [];
      arr.push(`- [${fact.category}] ${fact.content}`);
      bySubject.set(key, arr);
    }

    const factBlocks = Array.from(bySubject.entries())
      .map(([subject, facts]) => `**${subject}:**\n${facts.join("\n")}`)
      .join("\n\n");

    sections.push(
      `## Known facts about this person\n\nThese are verified facts from your conversations. They are EXACT — do not paraphrase, embellish, or confuse any detail. If a fact says "father", say "father". If it says "Sarah", say "Sarah".\n\n${factBlocks}`,
    );
  }

  // ── Structured personality data (highest-value context) ──
  if (personalityContext) {
    sections.push(personalityContext);
  }

  // ── 10x Vision (North Star context) ──
  if (visionContext) {
    sections.push(visionContext);
  }

  // ── Active systems (daily/weekly actions) ──
  if (systemsContext) {
    sections.push(systemsContext);
  }

  // ── Past chat sessions (summaries for token efficiency) ──
  if (pastChatSessions.length > 0) {
    const sessionBlocks = pastChatSessions
      .filter((s) => s._count.messages > 0)
      .map((s) => {
        const date = s.updatedAt.toISOString().slice(0, 10);
        const title = s.title ?? "Untitled";

        // Prefer the AI-generated summary (accurate + token-efficient)
        if (s.summary) {
          return `### [${date}] "${title}"\n\n${s.summary}`;
        }

        // Fallback: use first few user messages as context
        if (s.messages.length > 0) {
          const previews = s.messages
            .map((m) => truncate(m.content, 300))
            .join(" | ");
          return `### [${date}] "${title}"\n\nTopics discussed: ${previews}`;
        }

        return `- [${date}] "${title}" — (no summary available)`;
      });

    if (sessionBlocks.length > 0) {
      sections.push(
        `## Your past conversations with this person\n\nThese are factual summaries of your sessions. Every detail — names, relationships, stories, commitments — is recorded precisely. Recall them EXACTLY as written. Do not alter names or relationships.\n\n${sessionBlocks.join("\n\n---\n\n")}`,
      );
    }
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
      const content = truncate(doc.extractedContent, 1000);
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

