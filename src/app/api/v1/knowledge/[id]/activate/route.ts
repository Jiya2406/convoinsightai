import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { knowledgeService } from "@/server/services/knowledge.service";

// POST /api/v1/knowledge/:id/activate — make this the active knowledge version.
export const POST = route({ permission: "knowledge:manage" }, async ({ params, session }) => {
  const knowledge = await knowledgeService.activate(params.id, session.user.id);
  return ok(knowledge);
});

export const runtime = "nodejs";
