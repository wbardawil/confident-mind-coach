import { z } from "zod";

/**
 * Zod schemas for validating structured AI responses.
 * Every AI output must be validated before rendering.
 */

// ─── ESP Response ──────────────────────────────

export const espResponseSchema = z.object({
  reflection: z
    .string()
    .min(1, "Reflection is required"),
  affirmation: z
    .string()
    .min(1, "Affirmation is required"),
  ledgerImpact: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    scoreDelta: z.number().int().min(1).max(5),
  }),
});

export type EspResponse = z.infer<typeof espResponseSchema>;

// ─── Pregame Response ───────────────────────────

export const pregameResponseSchema = z.object({
  takeStock: z.string().min(1, "takeStock is required"),
  situationAssessment: z.string().min(1, "situationAssessment is required"),
  enoughStatement: z.string().min(1, "enoughStatement is required"),
  visualizationPrompt: z.string().min(1, "visualizationPrompt is required"),
});

export type PregameResponse = z.infer<typeof pregameResponseSchema>;

// ─── Reset Response ─────────────────────────────

export const resetResponseSchema = z.object({
  acknowledgement: z.string().min(1, "acknowledgement is required"),
  safeguard: z.string().min(1, "safeguard is required"),
  nextActionCue: z.string().min(1, "nextActionCue is required"),
});

export type ResetResponse = z.infer<typeof resetResponseSchema>;

// ─── AAR Response ───────────────────────────────

export const aarResponseSchema = z.object({
  lessonsLearned: z.string().min(1, "lessonsLearned is required"),
  improvementPlan: z.string().min(1, "improvementPlan is required"),
});

export type AarResponse = z.infer<typeof aarResponseSchema>;
