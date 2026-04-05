import { db } from "@/lib/utils/db";
import { generateCoaching } from "@/lib/ai/client";

/**
 * The coach's private notebook. After every interaction, the AI writes
 * a coaching note capturing observations, patterns, and insights about
 * the user. These notes compound into a rich understanding over time.
 *
 * Notes are fire-and-forget — they run async after the response is sent
 * so they don't slow down the user experience.
 */

type JournalType =
  | "session"    // after a coach chat
  | "esp"        // after an ESP reflection
  | "reset"      // after a Reset
  | "pregame"    // after a Pregame
  | "aar"        // after an AAR
  | "challenge"  // after a challenge day
  | "weekly"     // weekly synthesis
  | "monthly"    // monthly synthesis
  | "quarterly"; // quarterly DNA

interface WriteJournalInput {
  userId: string;
  type: JournalType;
  sourceId?: string;
  context: string; // what happened — the raw data for the AI to process
  profileContext?: string; // user profile for richer notes
}

/**
 * Write a coaching journal entry. The AI processes the interaction
 * and writes a concise coaching note from the coach's perspective.
 *
 * Call this fire-and-forget (don't await in the request path).
 */
export async function writeJournalEntry(input: WriteJournalInput): Promise<void> {
  try {
    const typePrompts: Record<JournalType, string> = {
      session: "a coaching conversation",
      esp: "an ESP (Effort, Success, Progress) reflection",
      reset: "a confidence Reset after a setback",
      pregame: "a Pregame mental preparation routine",
      aar: "an After Action Review",
      challenge: "a challenge day exercise",
      weekly: "the past week of coaching activity",
      monthly: "the past month of coaching activity",
      quarterly: "the past quarter of coaching activity",
    };

    const systemPrompt = `You are a performance coach writing private session notes about your client. These notes are for YOUR reference only — the client never sees them.

${input.profileContext ?? ""}

You just completed ${typePrompts[input.type]} with this person. Write a brief coaching note (3-5 sentences) capturing:

1. **What you observed** — patterns, emotional state, engagement level, recurring themes
2. **What matters** — breakthroughs, sticking points, shifts in confidence or mindset
3. **What to follow up on** — commitments they made, topics to revisit, emerging patterns

Write in first person as the coach. Be specific — reference their actual words and situations. These notes will help you provide continuity in future sessions.

If this is a weekly/monthly/quarterly synthesis, focus on patterns across time, trajectory of change, and emerging themes rather than individual session details.`;

    const result = await generateCoaching({
      systemPrompt,
      userMessage: input.context,
      maxTokens: 300,
      temperature: 0.3,
    });

    await db.coachingJournal.create({
      data: {
        userId: input.userId,
        type: input.type,
        sourceId: input.sourceId ?? null,
        content: result.text,
        period: input.type === "weekly" || input.type === "monthly" || input.type === "quarterly"
          ? getPeriodLabel(input.type)
          : null,
      },
    });
  } catch (error) {
    // Journal writes are best-effort — never fail the main flow
    console.error("[coaching-journal] Failed to write entry:", error instanceof Error ? error.message : error);
  }
}

function getPeriodLabel(type: "weekly" | "monthly" | "quarterly"): string {
  const now = new Date();
  const year = now.getFullYear();

  switch (type) {
    case "weekly": {
      const startOfYear = new Date(year, 0, 1);
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
      const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
      return `${year}-W${String(week).padStart(2, "0")}`;
    }
    case "monthly":
      return `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    case "quarterly": {
      const quarter = Math.ceil((now.getMonth() + 1) / 3);
      return `${year}-Q${quarter}`;
    }
  }
}

/**
 * Generate a weekly synthesis from the past 7 days of journal entries.
 */
export async function generateWeeklySynthesis(userId: string): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentNotes = await db.coachingJournal.findMany({
    where: {
      userId,
      createdAt: { gte: sevenDaysAgo },
      type: { in: ["session", "esp", "reset", "pregame", "aar", "challenge"] },
    },
    orderBy: { createdAt: "asc" },
    select: { type: true, content: true, createdAt: true },
  });

  if (recentNotes.length === 0) return;

  const context = recentNotes
    .map((n) => `[${n.createdAt.toISOString().slice(0, 10)}] (${n.type}) ${n.content}`)
    .join("\n\n");

  const profile = await db.profile.findFirst({ where: { userId } });
  const profileContext = profile
    ? `Client: ${profile.role} in ${profile.performanceDomain}. Strengths: ${profile.strengths.join(", ")}.`
    : "";

  await writeJournalEntry({
    userId,
    type: "weekly",
    context: `Here are my coaching notes from this week:\n\n${context}`,
    profileContext,
  });
}

/**
 * Generate a monthly synthesis from weekly summaries.
 */
export async function generateMonthlySynthesis(userId: string): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const weeklies = await db.coachingJournal.findMany({
    where: {
      userId,
      createdAt: { gte: thirtyDaysAgo },
      type: "weekly",
    },
    orderBy: { createdAt: "asc" },
    select: { content: true, period: true, createdAt: true },
  });

  if (weeklies.length === 0) return;

  const context = weeklies
    .map((w) => `[${w.period}] ${w.content}`)
    .join("\n\n");

  const profile = await db.profile.findFirst({ where: { userId } });
  const profileContext = profile
    ? `Client: ${profile.role} in ${profile.performanceDomain}. Strengths: ${profile.strengths.join(", ")}.`
    : "";

  await writeJournalEntry({
    userId,
    type: "monthly",
    context: `Here are my weekly coaching summaries from this month:\n\n${context}`,
    profileContext,
  });
}
