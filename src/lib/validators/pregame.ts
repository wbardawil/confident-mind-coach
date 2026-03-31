import { z } from "zod";

export const pregameInputSchema = z.object({
  upcomingEvent: z.string().min(1, "Describe the upcoming event"),
  confidenceLevel: z.number().int().min(1).max(10),
  fear: z.string().min(1, "Describe your main fear or concern"),
  definitionOfSuccess: z.string().min(1, "Define what success looks like"),
  goalId: z.string().optional(),
});

export type PregameInput = z.infer<typeof pregameInputSchema>;
