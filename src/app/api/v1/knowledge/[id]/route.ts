import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { knowledgeService } from "@/server/services/knowledge.service";

// GET /api/v1/knowledge/:id — version detail with documents.
export const GET = route({ permission: "dashboard:view" }, async ({ params }) => {
  const knowledge = await knowledgeService.getById(params.id);
  return ok(knowledge);
});

export const runtime = "nodejs";
