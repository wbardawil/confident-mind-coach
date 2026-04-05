/**
 * Lightweight coaching quality monitor.
 *
 * After each coach response, checks whether the response references the
 * user's actual context. No additional AI calls — string matching only.
 *
 * Quality dimensions:
 * - Context usage: does the response mention any known achievements/goals?
 * - Boundary compliance: no therapy/medical keywords
 * - Length: within configured limits
 */

import { db } from "@/lib/utils/db";

// ─── Boundary violation keywords ──

const BOUNDARY_KEYWORDS = [
  "diagnosis",
  "diagnose",
  "medication",
  "prescribe",
  "prescription",
  "psychiatric",
  "mental illness",
  "clinical depression",
  "bipolar",
  "schizophrenia",
];

// ─── Quality score ──

export interface QualityScore {
  contextReferences: number;  // how many known context items appear in the response
  boundaryViolation: boolean; // true if response contains boundary keywords
  responseLength: number;     // character count
  score: number;              // 0-100 composite quality score
}

/**
 * Score a coach response for quality.
 *
 * @param response - The AI coach's response text
 * @param userId - The user who received the response
 */
export async function scoreResponse(
  response: string,
  userId: string,
): Promise<QualityScore> {
  const responseLower = response.toLowerCase();

  // Check boundary compliance
  const boundaryViolation = BOUNDARY_KEYWORDS.some((kw) =>
    responseLower.includes(kw),
  );

  // Load user's achievements and goals for context matching
  const [achievements, goals] = await Promise.all([
    db.achievement.findMany({
      where: { userId },
      select: { title: true },
      take: 10,
    }),
    db.confidenceGoal.findMany({
      where: { userId, status: "active" },
      select: { title: true },
      take: 5,
    }),
  ]);

  // Count how many context items appear in the response
  let contextReferences = 0;
  for (const item of [...achievements, ...goals]) {
    // Check if meaningful words from the title appear in the response
    const words = item.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    for (const word of words) {
      if (responseLower.includes(word)) {
        contextReferences++;
        break;
      }
    }
  }

  // Composite score (0-100)
  let score = 50; // baseline
  if (contextReferences > 0) score += Math.min(30, contextReferences * 10);
  if (boundaryViolation) score -= 40;
  if (response.length < 50) score -= 20; // suspiciously short
  if (response.length > 3000) score -= 10; // too verbose
  score = Math.max(0, Math.min(100, score));

  return {
    contextReferences,
    boundaryViolation,
    responseLength: response.length,
    score,
  };
}
