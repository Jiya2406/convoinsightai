import { z } from "zod";

/** Providers are a fixed set (seeded); admins can toggle/activate + set config. */
export const updateProviderSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
