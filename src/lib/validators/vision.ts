import { z } from "zod";

export const VISION_DOMAINS = [
  "career",
  "financial",
  "personal",
  "health",
  "relationship",
  "custom",
] as const;

export type VisionDomainType = (typeof VISION_DOMAINS)[number];

export const VISION_DOMAIN_LABELS: Record<VisionDomainType, string> = {
  career: "Career & Business",
  financial: "Financial",
  personal: "Personal Growth",
  health: "Health & Fitness",
  relationship: "Relationships",
  custom: "Custom",
};

export const visionSchema = z
  .object({
    domain: z.enum(VISION_DOMAINS),
    customLabel: z
      .string()
      .trim()
      .max(100, "Label must be 100 characters or less")
      .optional(),
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
  })
  .refine(
    (data) => data.domain !== "custom" || (data.customLabel && data.customLabel.length > 0),
    { message: "Name your custom life domain", path: ["customLabel"] },
  );

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

/**
 * Returns the display label for a vision domain,
 * using the custom label for custom domains.
 */
export function getVisionDomainLabel(domain: string, customLabel?: string | null): string {
  if ((domain === "custom" || domain === "other") && customLabel) return customLabel;
  if (domain === "other") return "Other";
  return VISION_DOMAIN_LABELS[domain as VisionDomainType] ?? domain;
}
