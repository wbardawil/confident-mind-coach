/**
 * AI-powered system proposals for goals.
 *
 * Given a goal, personality, and vision context, the AI proposes
 * concrete repeatable actions (systems) that move toward the goal.
 */

import { z } from "zod";
import { db } from "@/lib/utils/db";
import { generateCoaching } from "@/lib/ai/client";
import { parseAiResponse } from "@/lib/ai/parse";
import { getPersonalityContext } from "@/lib/coaching/personality";
import { getVisionContext } from "@/lib/coaching/vision";

// ─── AI proposal schema ─────────────────────────

const proposedSystemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  frequency: z.enum(["daily", "weekly", "per-event"]),
});

const systemProposalSchema = z.object({
  systems: z.array(proposedSystemSchema).min(1).max(5),
});

export type ProposedSystem = z.infer<typeof proposedSystemSchema>;

// ─── Propose systems for a goal ──────────────────

export async function proposeSystemsForGoal(
  userId: string,
  goalTitle: string,
  goalDescription: string | null,
  goalCategory: string,
): Promise<
  | { success: true; systems: ProposedSystem[] }
  | { success: false; error: string }
> {
  // Gather context
  const [personalityContext, visionContext] = await Promise.all([
    getPersonalityContext(userId),
    getVisionContext(userId),
  ]);

  const contextBlock = [personalityContext, visionContext]
    .filter(Boolean)
    .join("\n\n");

  const prompt = {
    systemPrompt: `You are a mental performance coach designing daily and weekly systems (repeatable actions) for a client.

A "system" is a specific, repeatable action that builds toward a goal. Not a vague intention — a concrete behavior with a clear frequency.

Good systems:
- "Write 500 words every morning before checking email" (daily)
- "Cold-call 5 prospects on Monday and Thursday" (weekly)
- "Do a 5-minute visualization before every client meeting" (per-event)

Bad systems:
- "Be more productive" (vague)
- "Work harder" (not specific)
- "Network more" (no concrete action)

## Instructions

1. Propose 2-3 systems that will move this person toward their goal.
2. Each system must be concrete, specific, and have a clear frequency.
3. If you have personality data, design systems that work WITH their wiring — not against it.
4. If you have vision context, connect systems to the bigger picture.
5. Keep descriptions to 1-2 sentences explaining WHY this system works.

Return ONLY valid JSON:
{
  "systems": [
    {
      "title": "Cold-call 3 prospects every morning before 10am",
      "description": "Builds the outreach muscle daily. Morning timing leverages your high-D drive before the day gets reactive.",
      "frequency": "daily"
    }
  ]
}

${contextBlock ? `\n## Context about this person\n\n${contextBlock}` : ""}`,
    userMessage: `Goal: ${goalTitle}${goalDescription ? `\nWhy it matters: ${goalDescription}` : ""}\nCategory: ${goalCategory}`,
    maxTokens: 800,
    temperature: 0.5,
  };

  let rawResponse: string;
  try {
    const result = await generateCoaching(prompt);
    rawResponse = result.text;
  } catch (e) {
    return {
      success: false,
      error: `AI proposal failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const result = parseAiResponse(rawResponse, systemProposalSchema);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, systems: result.data.systems };
}

// ─── Systems context for coaching prompts ────────

/**
 * Build coaching context from a user's active systems across all goals.
 * Returns empty string if no systems exist.
 */
export async function getSystemsContext(userId: string): Promise<string> {
  const goals = await db.confidenceGoal.findMany({
    where: { userId, status: "active" },
    select: {
      title: true,
      systems: {
        where: { status: "active" },
        select: {
          title: true,
          frequency: true,
          streak: true,
          lastDoneAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const goalsWithSystems = goals.filter((g) => g.systems.length > 0);
  if (goalsWithSystems.length === 0) return "";

  const blocks = goalsWithSystems.map((g) => {
    const systemLines = g.systems.map((s) => {
      const streakTag = s.streak > 0 ? ` (${s.streak}-day streak)` : "";
      const lastDone = s.lastDoneAt
        ? ` — last done ${s.lastDoneAt.toISOString().slice(0, 10)}`
        : " — not started yet";
      return `  - [${s.frequency}] ${s.title}${streakTag}${lastDone}`;
    });
    return `**${g.title}**\n${systemLines.join("\n")}`;
  });

  return `## Active Systems

These are the repeatable actions this person has committed to. Ask about them. Follow up on streaks. Notice when they're skipping. Systems are how confidence compounds.

${blocks.join("\n\n")}`;
}
