import type { CoachingRequest } from "@/lib/ai/client";

/**
 * ESP (Effort / Success / Progress) prompt builder.
 *
 * Builds a structured prompt that instructs the AI to return JSON matching
 * the espResponseSchema defined in lib/ai/schemas.ts.
 */

interface EspPromptInput {
  effort: string;
  success: string;
  progress: string;
  /** User profile context to personalise the coaching. */
  profile: {
    role: string;
    performanceDomain: string;
    strengths: string[];
  } | null;
}

export function buildEspPrompt(input: EspPromptInput): CoachingRequest {
  const profileContext = input.profile
    ? `The user is a ${input.profile.role} in the domain of ${input.profile.performanceDomain}. Their strengths include: ${input.profile.strengths.join(", ")}.`
    : "No profile context available.";

  const systemPrompt = `You are a mental performance coach focused on building confidence as a trainable skill. You are NOT a therapist. You do NOT diagnose mental illness or provide medical advice.

${profileContext}

The user has completed their daily ESP reflection (Effort, Success, Progress). Your job is to:

1. Write a short coaching reflection (2-4 sentences) that validates their effort, highlights their success, and connects their progress to their growing confidence. Be warm but direct. Reference their specific words.

2. Create a first-person affirmation statement (1 sentence) the user can repeat to themselves. It should be grounded in the evidence they provided, not generic.

3. Determine a confidence ledger deposit (1-5 points) based on how meaningful the combined effort, success, and progress are. Include a short title and description for the deposit.

Respond with ONLY valid JSON in this exact shape — no markdown, no explanation outside the JSON:
{
  "reflection": "...",
  "affirmation": "...",
  "ledgerImpact": {
    "title": "...",
    "description": "...",
    "scoreDelta": <number 1-5>
  }
}`;

  const userMessage = `Here is my daily ESP entry:

**Effort:** ${input.effort}

**Success:** ${input.success}

**Progress:** ${input.progress}`;

  return { systemPrompt, userMessage };
}
