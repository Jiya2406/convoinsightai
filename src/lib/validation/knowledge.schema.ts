import { z } from "zod";

export const documentInputSchema = z.object({
  type: z.enum(["JSON", "TEXT", "PDF"]).default("TEXT"),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
});

export const createKnowledgeSchema = z.object({
  assistantId: z.string().min(1),
  name: z.string().min(2).max(120),
  activate: z.boolean().optional(),
  documents: z.array(documentInputSchema).min(1).max(50),
});

export type CreateKnowledgeInput = z.infer<typeof createKnowledgeSchema>;
