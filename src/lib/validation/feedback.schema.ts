import { z } from "zod";

export const submitFeedbackSchema = z.object({
  messageId: z.string().min(1),
  type: z.enum(["UP", "DOWN"]),
  comment: z.string().max(1000).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
