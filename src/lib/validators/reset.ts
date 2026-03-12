import { z } from "zod";

export const resetInputSchema = z.object({
  eventDescription: z.string().min(1, "Describe what happened"),
  emotionalState: z.string().min(1, "Describe how you feel right now"),
  confidenceScore: z.number().int().min(1).max(10),
});

export type ResetInput = z.infer<typeof resetInputSchema>;
