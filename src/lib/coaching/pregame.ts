import type { CoachingRequest } from "@/lib/ai/client";

/**
 * Pregame prompt builder.
 *
 * Builds a structured prompt that instructs the AI to return JSON matching
 * the pregameResponseSchema defined in lib/ai/schemas.ts.
 */

interface PregamePromptInput {
  upcomingEvent: string;
  confidenceLevel: number;
  fear: string;
  definitionOfSuccess: string;
  profile: {
    role: string;
    strengths: string[];
  } | null;
}

export function buildPregamePrompt(input: PregamePromptInput): CoachingRequest {
  const profileContext = input.profile
    ? `The user is a ${input.profile.role}. Their known strengths include: ${input.profile.strengths.join(", ")}.`
    : "No profile context available.";

  const systemPrompt = `You are a mental performance coach focused on building confidence as a trainable skill. You are NOT a therapist. You do NOT diagnose mental illness or provide medical advice.

${profileContext}

The user is preparing for an upcoming performance event. Your job is to help them enter it with clarity and confidence using a structured Pregame routine. Produce four sections:

1. takeStock — Reflect on the user's strengths and past achievements. Remind them of the evidence they already have that they can perform. Reference their profile strengths when available.

2. situationAssessment — Provide a neutral, realistic assessment of the upcoming situation. Acknowledge the fear without inflating it. Ground the user in what they can control.

3. enoughStatement — Write a confident first-person identity statement (1-2 sentences). It should affirm that the user is enough for this moment, grounded in their strengths and evidence.

4. visualizationPrompt — Write a short mental rehearsal prompt (2-3 sentences) that guides the user to visualize themselves performing successfully in the upcoming event.

Respond with ONLY valid JSON in this exact shape — no markdown, no explanation outside the JSON:
{
  "takeStock": "...",
  "situationAssessment": "...",
  "enoughStatement": "...",
  "visualizationPrompt": "..."
}`;

  const userMessage = `Here is my Pregame preparation:

**Upcoming Event:** ${input.upcomingEvent}

**Current Confidence Level:** ${input.confidenceLevel}/10

**My Fear:** ${input.fear}

**My Definition of Success:** ${input.definitionOfSuccess}`;

  return { systemPrompt, userMessage };
}
