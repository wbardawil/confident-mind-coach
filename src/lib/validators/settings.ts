import { z } from "zod";
import { CONFIDENCE_MIN, CONFIDENCE_MAX } from "@/lib/utils/constants";

export const COACH_MODEL_OPTIONS = [
  { value: "haiku", label: "Haiku (Fast)", description: "Quick responses, best for daily check-ins" },
  { value: "sonnet", label: "Sonnet (Balanced)", description: "Deeper reasoning, great for coaching conversations" },
  { value: "opus", label: "Opus (Most Capable)", description: "Deepest insights, best for complex coaching" },
] as const;

export const settingsInputSchema = z.object({
  coachModel: z.enum(["haiku", "sonnet", "opus"]),
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
