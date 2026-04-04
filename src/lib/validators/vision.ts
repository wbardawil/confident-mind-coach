import { z } from "zod";
import { GOAL_CATEGORIES } from "@/lib/validators/goals";

export const VISION_DOMAINS = GOAL_CATEGORIES;

export type VisionDomainType = (typeof VISION_DOMAINS)[number];

export const VISION_DOMAIN_LABELS: Record<VisionDomainType, string> = {
  career: "Career & Business",
  financial: "Financial",
  personal: "Personal Growth",
  health: "Health & Fitness",
  relationship: "Relationships",
  other: "Other",
};

export const visionSchema = z.object({
  domain: z.enum(VISION_DOMAINS),
  vision: z
    .string()
    .trim()
    .min(1, "Describe your 10x vision")
    .max(2000, "Vision must be 2000 characters or less"),
  currentState: z
    .string()
    .trim()
    .max(2000, "Current state must be 2000 characters or less")
    .optional(),
});

export type VisionInput = z.infer<typeof visionSchema>;

export const visionUpdateSchema = z.object({
  vision: z
    .string()
    .trim()
    .min(1, "Describe your 10x vision")
    .max(2000, "Vision must be 2000 characters or less"),
  currentState: z
    .string()
    .trim()
    .max(2000, "Current state must be 2000 characters or less")
    .optional(),
});

export type VisionUpdateInput = z.infer<typeof visionUpdateSchema>;
