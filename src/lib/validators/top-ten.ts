import { z } from "zod";

export const achievementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  evidence: z.string().min(1, "Evidence is required"),
  occurredAt: z.string().optional(),
  rank: z.number().min(1).max(10).optional(),
});

export type AchievementInput = z.infer<typeof achievementSchema>;
