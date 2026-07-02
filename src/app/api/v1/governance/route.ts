import { route } from "@/lib/api/handler";
import { ok, created } from "@/lib/api/response";
import { createGovernanceRuleSchema } from "@/lib/validation/governance.schema";
import { governanceService } from "@/server/services/governance.service";

// GET /api/v1/governance?assistantId=... — list governance rules.
export const GET = route({ permission: "governance:manage" }, async ({ searchParams }) => {
  const assistantId = searchParams.get("assistantId") ?? undefined;
  const rules = await governanceService.list(assistantId);
  return ok(rules);
});

// POST /api/v1/governance — create a governance rule.
export const POST = route({ permission: "governance:manage" }, async ({ req, session }) => {
  const body = createGovernanceRuleSchema.parse(await req.json());
  const rule = await governanceService.createRule(body, session.user.id);
  return created(rule);
});

export const runtime = "nodejs";
