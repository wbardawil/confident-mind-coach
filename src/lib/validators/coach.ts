import { z } from "zod";

export const chatMessageSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1, "Say something to your coach").max(10000),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
