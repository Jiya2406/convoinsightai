import { z } from "zod";

export const runPromptTestSchema = z.object({
  assistantId: z.string().min(1),
  name: z.string().max(120).optional(),
  promptA: z.string().min(5).max(5000),
  promptB: z.string().min(5).max(5000),
  input: z.string().min(1).max(4000),
});

export type RunPromptTestInput = z.infer<typeof runPromptTestSchema>;
