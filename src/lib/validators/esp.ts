import { z } from "zod";

export const espInputSchema = z.object({
  effort: z.string().min(1, "Describe the effort you put in today"),
  success: z.string().min(1, "Describe something that went well"),
  progress: z.string().min(1, "Describe the progress you made"),
});

export type EspInput = z.infer<typeof espInputSchema>;
