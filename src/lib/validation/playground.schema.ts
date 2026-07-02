import { z } from "zod";

export const sendMessageSchema = z.object({
  assistantId: z.string().min(1),
  prompt: z.string().min(1).max(4000),
  conversationId: z.string().min(1).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
