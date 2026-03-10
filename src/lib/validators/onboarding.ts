import { z } from "zod";

export const onboardingSchema = z.object({
  role: z.string().min(1, "Role is required"),
  performanceDomain: z.string().min(1, "Performance domain is required"),
  strengths: z.array(z.string()).min(1, "Add at least one strength"),
  confidenceChallenges: z
    .array(z.string())
    .min(1, "Add at least one challenge"),
  recurringTriggers: z.array(z.string()).min(1, "Add at least one trigger"),
  baselineScore: z.number().min(1).max(10),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
