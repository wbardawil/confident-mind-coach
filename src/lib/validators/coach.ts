import { z } from "zod";

export const CHAT_MESSAGE_MAX_CHARS = 2000;

export const chatMessageSchema = z.object({
  sessionId: z.string().optional(),
  message: z
    .string()
    .min(1, "Say something to your coach")
    .max(CHAT_MESSAGE_MAX_CHARS, `Messages can be up to ${CHAT_MESSAGE_MAX_CHARS} characters. For longer content, use document upload.`),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
