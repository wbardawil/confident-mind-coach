import { z } from "zod";
import { CONFIDENCE_MIN, CONFIDENCE_MAX } from "@/lib/utils/constants";

export const COACH_MODEL_OPTIONS = [
  { value: "haiku-4.5", label: "Haiku 4.5", description: "Fast responses, best for daily check-ins" },
  { value: "sonnet-3.5", label: "Sonnet 3.5", description: "Solid reasoning, great for coaching conversations" },
  { value: "sonnet-4", label: "Sonnet 4 (Recommended)", description: "Latest Sonnet — deeper reasoning, better memory synthesis" },
  { value: "opus-3", label: "Opus 3", description: "Most capable — deepest insights for complex coaching" },
] as const;

export const settingsInputSchema = z.object({
  coachModel: z.enum(["haiku-4.5", "sonnet-3.5", "sonnet-4", "opus-3"]),
  displayName: z
    .string()
    .trim()
    .max(100, "Name must be 100 characters or less"),
  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(100, "Role must be 100 characters or less"),
  performanceDomain: z
    .string()
    .trim()
    .min(1, "Performance domain is required")
    .max(200, "Performance domain must be 200 characters or less"),
  baselineScore: z
    .number()
    .int("Must be a whole number")
    .min(CONFIDENCE_MIN, `Minimum is ${CONFIDENCE_MIN}`)
    .max(CONFIDENCE_MAX, `Maximum is ${CONFIDENCE_MAX}`),
  strengths: z
    .array(z.string().trim().min(1).max(50, "Each strength must be 50 characters or less"))
    .min(1, "Add at least one strength")
    .max(20, "Maximum 20 strengths")
    .transform((arr) => Array.from(new Set(arr.map((s) => s.toLowerCase())))),
  confidenceChallenges: z
    .array(z.string().trim().min(1).max(50, "Each challenge must be 50 characters or less"))
    .max(20, "Maximum 20 challenges")
    .transform((arr) => Array.from(new Set(arr.map((s) => s.toLowerCase())))),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
