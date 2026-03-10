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
