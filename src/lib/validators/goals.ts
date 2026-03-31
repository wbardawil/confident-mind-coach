import { z } from "zod";
import { CONFIDENCE_MIN, CONFIDENCE_MAX } from "@/lib/utils/constants";

export const GOAL_CATEGORIES = [
  "career",
  "financial",
  "personal",
  "health",
  "relationship",
  "other",
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  career: "Career",
  financial: "Financial",
  personal: "Personal Growth",
  health: "Health & Fitness",
  relationship: "Relationships",
  other: "Other",
};

export const goalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Goal title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),
  category: z.enum(GOAL_CATEGORIES),
  targetDate: z.string().optional(),
  efficacyScore: z
    .number()
    .int()
    .min(CONFIDENCE_MIN, `Minimum is ${CONFIDENCE_MIN}`)
    .max(CONFIDENCE_MAX, `Maximum is ${CONFIDENCE_MAX}`),
});

export type GoalInput = z.infer<typeof goalSchema>;

export const efficacyUpdateSchema = z.object({
  efficacyScore: z
    .number()
    .int()
    .min(CONFIDENCE_MIN)
    .max(CONFIDENCE_MAX),
});
