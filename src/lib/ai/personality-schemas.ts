import { z } from "zod";

/**
 * Zod schemas for AI personality extraction responses.
 * Used to validate structured personality data extracted from uploaded documents.
 */

export const PERSONALITY_FRAMEWORKS = [
  "DISC",
  "MBTI",
  "EA",            // Entrepreneurial Assessment / Working Genius
  "StrengthsFinder",
  "VIA",           // VIA Character Strengths
  "Enneagram",
  "Big5",
  "other",
] as const;

export type PersonalityFramework = (typeof PERSONALITY_FRAMEWORKS)[number];

export const extractedAssessmentSchema = z.object({
  framework: z.enum(PERSONALITY_FRAMEWORKS),
  label: z.string().min(1).max(100),
  dimensions: z.record(z.string(), z.union([z.number(), z.string()])),
  summary: z.string().min(1).max(2000),
  coachingTips: z.string().min(1).max(2000),
});

export type ExtractedAssessment = z.infer<typeof extractedAssessmentSchema>;

export const personalityExtractionSchema = z.object({
  assessments: z.array(extractedAssessmentSchema),
  noAssessmentFound: z.boolean(),
});

export type PersonalityExtractionResult = z.infer<typeof personalityExtractionSchema>;
