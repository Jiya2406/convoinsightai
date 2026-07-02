import { route } from "@/lib/api/handler";
import { ok, noContent } from "@/lib/api/response";
import { updateGovernanceRuleSchema } from "@/lib/validation/governance.schema";
import { governanceService } from "@/server/services/governance.service";

// PATCH /api/v1/governance/:id — update a rule.
export const PATCH = route({ permission: "governance:manage" }, async ({ req, params, session }) => {
  const body = updateGovernanceRuleSchema.parse(await req.json());
  const rule = await governanceService.updateRule(params.id, body, session.user.id);
  return ok(rule);
});

// DELETE /api/v1/governance/:id — delete a rule.
export const DELETE = route({ permission: "governance:manage" }, async ({ params, session }) => {
  await governanceService.deleteRule(params.id, session.user.id);
  return noContent();
});

export const runtime = "nodejs";
