import { z } from "zod";

export const createAssistantSchema = z.object({
  name: z.string().min(2).max(100),
  domain: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().min(10).max(5000),
  providerId: z.string().cuid(),
  model: z.string().min(1).max(100).optional(),
  temperature: z.number().min(0).max(2).optional(),
  isActive: z.boolean().optional(),
});

export const updateAssistantSchema = createAssistantSchema.partial();

export type CreateAssistantInput = z.infer<typeof createAssistantSchema>;
export type UpdateAssistantInput = z.infer<typeof updateAssistantSchema>;
