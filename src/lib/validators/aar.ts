import { z } from "zod";

export const aarInputSchema = z.object({
  whatHappened: z.string().min(1, "Describe what happened"),
  soWhat: z.string().min(1, "Explain why it matters"),
  nowWhat: z.string().min(1, "Describe what comes next"),
});

export type AarInput = z.infer<typeof aarInputSchema>;
