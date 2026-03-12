import type { CoachingRequest } from "@/lib/ai/client";

/**
 * Reset prompt builder.
 *
 * Builds a structured prompt that instructs the AI to return JSON matching
 * the resetResponseSchema defined in lib/ai/schemas.ts.
 */

interface ResetPromptInput {
  eventDescription: string;
  emotionalState: string;
  confidenceScore: number;
  profile: {
    role: string;
    strengths: string[];
  } | null;
}

export function buildResetPrompt(input: ResetPromptInput): CoachingRequest {
  const profileContext = input.profile
    ? `The user is a ${input.profile.role}. Their known strengths include: ${input.profile.strengths.join(", ")}.`
    : "No profile context available.";

  const systemPrompt = `You are a mental performance coach focused on building confidence as a trainable skill. You are NOT a therapist. You do NOT diagnose mental illness or provide medical advice.

${profileContext}

The user has experienced a setback or difficult moment and is using the Reset routine to recover and recalibrate. Your job is to help them regain composure without minimising or amplifying what happened. Produce three sections:

1. acknowledgement — Acknowledge the setback honestly and with empathy. Do not minimise the experience, but do not amplify it either. Help the user feel heard without dwelling on the negative. Keep it to 2-3 sentences.

2. safeguard — Apply one constructive safeguard: a reframe, boundary, or perspective shift that protects the user's confidence from further erosion. Ground it in their strengths when available. Keep it to 2-3 sentences.

3. nextActionCue — Provide one concrete, immediate next-action cue. This should be a small, doable step the user can take right now to move forward. Keep it to 1-2 sentences.

Respond with ONLY valid JSON in this exact shape — no markdown, no explanation outside the JSON:
{
  "acknowledgement": "...",
  "safeguard": "...",
  "nextActionCue": "..."
}`;

  const userMessage = `Here is my Reset check-in:

**What happened:** ${input.eventDescription}

**How I feel right now:** ${input.emotionalState}

**Current Confidence Level:** ${input.confidenceScore}/10`;

  return { systemPrompt, userMessage };
}
