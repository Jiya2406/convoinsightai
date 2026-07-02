import { route } from "@/lib/api/handler";
import { ok, created } from "@/lib/api/response";
import { BadRequestError } from "@/lib/errors/api-error";
import { createKnowledgeSchema } from "@/lib/validation/knowledge.schema";
import { knowledgeService } from "@/server/services/knowledge.service";

// GET /api/v1/knowledge?assistantId=... — list knowledge versions for an assistant.
export const GET = route({ permission: "dashboard:view" }, async ({ searchParams }) => {
  const assistantId = searchParams.get("assistantId");
  if (!assistantId) throw new BadRequestError("assistantId query param is required");
  const versions = await knowledgeService.listForAssistant(assistantId);
  return ok(versions);
});

// POST /api/v1/knowledge — create a new knowledge version (admins).
export const POST = route({ permission: "knowledge:manage" }, async ({ req, session }) => {
  const body = createKnowledgeSchema.parse(await req.json());
  const knowledge = await knowledgeService.createVersion(body, session.user.id);
  return created(knowledge);
});

export const runtime = "nodejs";
