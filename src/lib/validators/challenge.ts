import { z } from "zod";

export const challengeDaySchema = z.object({
  reflection: z.string().min(1, "Share your reflection to continue"),
});

export type ChallengeDayInput = z.infer<typeof challengeDaySchema>;
