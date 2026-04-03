import type { CoachingRequest } from "@/lib/ai/client";
import { getDocumentContext } from "@/lib/actions/documents";

/**
 * ESP (Effort / Success / Progress) prompt builder.
 *
 * Builds a structured prompt that instructs the AI to return JSON matching
 * the espResponseSchema defined in lib/ai/schemas.ts.
 * Enriched with uploaded document context for deeper personalisation.
 */

interface EspPromptInput {
  effort: string;
  success: string;
  progress: string;
  /** User ID for fetching uploaded document context. */
  userId: string;
  /** User profile context to personalise the coaching. */
  profile: {
    role: string;
    performanceDomain: string;
    strengths: string[];
  } | null;
}

export async function buildEspPrompt(input: EspPromptInput): Promise<CoachingRequest> {
  const profileContext = input.profile
    ? `The user is a ${input.profile.role} in the domain of ${input.profile.performanceDomain}. Their strengths include: ${input.profile.strengths.join(", ")}.`
    : "No profile context available.";

  // Fetch uploaded documents for richer coaching context
  const documentContext = await getDocumentContext(input.userId);
  const documentSection = documentContext
    ? `\n\nThe user has uploaded the following documents to provide additional context about themselves:\n\n${documentContext}`
    : "";

  const systemPrompt = `You are a mental performance coach focused on building confidence as a trainable skill. You are NOT a therapist. You do NOT diagnose mental illness or provide medical advice.

${profileContext}${documentSection}

The user has completed their daily ESP reflection (Effort, Success, Progress). Your job is to:

1. Write a short coaching reflection (2-4 sentences) that validates their effort, highlights their success, and connects their progress to their growing confidence. Be warm but direct. Reference their specific words.

2. Create a first-person affirmation statement (1 sentence) the user can repeat to themselves. It should be grounded in the evidence they provided, not generic.

3. Determine a confidence ledger deposit (0-5 points) based on the quality, specificity, and meaningfulness of the combined effort, success, and progress. Include a short title and description for the deposit.

SCORING GUIDE — be honest, not generous:
  0 = Empty, vague, or meaningless input (e.g. "nothing", "idk", "stuff", single words with no substance). Do NOT reward low-effort entries.
  1 = Minimal effort — acknowledged something but vague or generic (e.g. "I tried today")
  2 = Basic reflection — some specific detail but surface-level
  3 = Solid reflection — clear, specific examples of effort, success, or progress
  4 = Strong reflection — detailed, self-aware, connects actions to growth
  5 = Exceptional — vivid, deeply honest, shows real insight and evidence of capability

If the input is meaningless or empty filler, give 0 points. Confidence must be built on real evidence, not participation trophies.

Respond with ONLY valid JSON in this exact shape — no markdown, no explanation outside the JSON:
{
  "reflection": "...",
  "affirmation": "...",
  "ledgerImpact": {
    "title": "...",
    "description": "...",
    "scoreDelta": <number 0-5>
  }
}`;

  const userMessage = `Here is my daily ESP entry:

**Effort:** ${input.effort}

**Success:** ${input.success}

**Progress:** ${input.progress}`;

  return { systemPrompt, userMessage };
}
