import { z } from "zod";

export const createGovernanceRuleSchema = z.object({
  assistantId: z.string().min(1).optional(),
  name: z.string().min(2).max(120),
  type: z.enum(["BANNED_WORD", "PII", "GROUNDING", "THRESHOLD"]),
  config: z.record(z.string(), z.unknown()).optional(),
  action: z.enum(["FLAG", "BLOCK"]),
  isActive: z.boolean().optional(),
});

export const updateGovernanceRuleSchema = createGovernanceRuleSchema.partial();

export type CreateGovernanceRuleInput = z.infer<typeof createGovernanceRuleSchema>;
export type UpdateGovernanceRuleInput = z.infer<typeof updateGovernanceRuleSchema>;
