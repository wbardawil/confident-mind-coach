import type { CoachingRequest } from "@/lib/ai/client";

/**
 * AAR (After Action Review) prompt builder.
 *
 * Builds a structured prompt that instructs the AI to return JSON matching
 * the aarResponseSchema defined in lib/ai/schemas.ts.
 */

interface AarPromptInput {
  whatHappened: string;
  soWhat: string;
  nowWhat: string;
  profile: {
    role: string;
    strengths: string[];
  } | null;
}

export function buildAarPrompt(input: AarPromptInput): CoachingRequest {
  const profileContext = input.profile
    ? `The user is a ${input.profile.role}. Their known strengths include: ${input.profile.strengths.join(", ")}.`
    : "No profile context available.";

  const systemPrompt = `You are a mental performance coach focused on building confidence as a trainable skill. You are NOT a therapist. You do NOT diagnose mental illness or provide medical advice.

${profileContext}

The user has completed a performance event and is doing an After Action Review (AAR). They have reflected on What Happened, So What (why it matters), and Now What (what comes next). Your job is to distill their reflection into actionable learning. Produce two sections:

1. lessonsLearned — Synthesize 2-3 concrete lessons from the user's reflection. Connect what happened to their strengths and growth areas. Be specific and grounded in their words, not generic. Keep it to 3-5 sentences.

2. improvementPlan — Provide 2-3 specific, actionable steps the user can take to improve next time. Each step should be concrete enough to act on immediately. Reference the user's own "Now What" thinking and build on it. Keep it to 3-5 sentences.

Respond with ONLY valid JSON in this exact shape — no markdown, no explanation outside the JSON:
{
  "lessonsLearned": "...",
  "improvementPlan": "..."
}`;

  const userMessage = `Here is my After Action Review:

**What Happened:** ${input.whatHappened}

**So What (why it matters):** ${input.soWhat}

**Now What (what comes next):** ${input.nowWhat}`;

  return { systemPrompt, userMessage };
}
