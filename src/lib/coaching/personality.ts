/**
 * Personality extraction and context building.
 *
 * Extracts structured personality assessment data from uploaded documents
 * using AI, and builds personality context for injection into coaching prompts.
 */

import { db } from "@/lib/utils/db";
import { generateCoaching, type CoachingRequest } from "@/lib/ai/client";
import { parseAiResponse } from "@/lib/ai/parse";
import {
  personalityExtractionSchema,
  type PersonalityExtractionResult,
} from "@/lib/ai/personality-schemas";

// ─── Extraction ──────────────────────────────────

/**
 * Build the prompt that instructs Claude to extract structured personality
 * assessment data from a document's text content.
 */
function buildExtractionPrompt(
  documentContent: string,
  fileName: string,
): CoachingRequest {
  const systemPrompt = `You are a structured data extraction system. Your job is to identify personality assessments, behavioral profiles, and strength inventories in document text, then extract their data into a structured format.

## Supported frameworks

- **DISC** — Dominance, Influence, Steadiness, Conscientiousness (scores or levels)
- **MBTI** — Myers-Briggs Type Indicator (4-letter type + preference strengths)
- **EA** — Entrepreneurial Assessment / Working Genius / Kolbe (working styles)
- **StrengthsFinder** — CliftonStrengths (top themes with rankings)
- **VIA** — VIA Character Strengths (top strengths with rankings)
- **Enneagram** — Type number + wing, instinctual variants
- **Big5** — OCEAN model (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
- **other** — Any other personality/behavioral framework

## Instructions

1. Read the document carefully. Look for assessment results, scores, type indicators, strength rankings, or behavioral profiles.
2. For each assessment found, extract:
   - **framework**: Which framework (use the exact keys above)
   - **label**: A human-friendly name, e.g. "DISC Profile (2024)" or "CliftonStrengths Top 5"
   - **dimensions**: Key-value pairs of the assessment's scores or categories. Use the framework's standard dimension names as keys. Values can be numbers (scores/percentages) or strings (types/descriptions).
   - **summary**: A 2-4 sentence plain-English summary of what the results mean for this person
   - **coachingTips**: 2-4 sentences on how a mental performance coach should use these results — what to lean into, what blind spots to watch for, what strategies would work best given this personality
3. If the document does NOT contain any personality assessment data, set noAssessmentFound to true and return an empty assessments array.
4. A single document may contain multiple assessments — extract all of them.

## Response format

Return ONLY valid JSON matching this structure:

{
  "assessments": [
    {
      "framework": "DISC",
      "label": "DISC Assessment (2024)",
      "dimensions": { "D": 85, "I": 42, "S": 60, "C": 30 },
      "summary": "High Dominance with moderate Steadiness...",
      "coachingTips": "Leverage their drive for results but watch for..."
    }
  ],
  "noAssessmentFound": false
}`;

  const userMessage = `Here is the content of the uploaded document "${fileName}". Extract any personality assessment data you find:\n\n${documentContent}`;

  return { systemPrompt, userMessage, maxTokens: 2000, temperature: 0.2 };
}

/**
 * Extract personality assessment data from a document's text content.
 * Returns structured extraction result validated by Zod.
 */
export async function extractPersonalityFromDocument(
  documentContent: string,
  fileName: string,
): Promise<
  | { success: true; data: PersonalityExtractionResult }
  | { success: false; error: string }
> {
  const prompt = buildExtractionPrompt(documentContent, fileName);

  let rawResponse: string;
  try {
    rawResponse = await generateCoaching(prompt);
  } catch (e) {
    return {
      success: false,
      error: `AI extraction failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  return parseAiResponse(rawResponse, personalityExtractionSchema);
}

// ─── Context builder ─────────────────────────────

/**
 * Format a single assessment's dimensions into a readable block.
 */
function formatDimensions(dimensions: Record<string, unknown>): string {
  return Object.entries(dimensions)
    .map(([key, value]) => `  - ${key}: ${value}`)
    .join("\n");
}

/**
 * Build a coaching-ready personality context string from all of a user's
 * personality assessments. Returns empty string if none exist.
 *
 * This context is injected into coaching prompts so the AI coach can
 * tailor its approach to the user's personality wiring.
 */
export async function getPersonalityContext(userId: string): Promise<string> {
  const assessments = await db.personalityAssessment.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      framework: true,
      label: true,
      dimensions: true,
      summary: true,
      coachingTips: true,
      verified: true,
    },
  });

  if (assessments.length === 0) return "";

  const blocks = assessments.map((a) => {
    const dims = a.dimensions as Record<string, unknown>;
    const verifiedTag = a.verified ? " (verified by user)" : "";
    return `### ${a.label}${verifiedTag}\n\n${formatDimensions(dims)}\n\n${a.summary}\n\n**Coaching implications:** ${a.coachingTips}`;
  });

  return `## Personality Profile\n\nYou have structured personality assessment data for this person. Use this to tailor your coaching approach — speak to their wiring, design strategies that work WITH their personality, and flag when their personality patterns may create blind spots.\n\n${blocks.join("\n\n---\n\n")}`;
}
