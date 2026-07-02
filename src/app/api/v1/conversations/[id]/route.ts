import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { conversationService } from "@/server/services/conversation.service";

// GET /api/v1/conversations/:id — detail with messages, evaluations, feedback.
export const GET = route({ permission: "dashboard:view" }, async ({ params }) => {
  const conversation = await conversationService.getById(params.id);
  return ok(conversation);
});

export const runtime = "nodejs";
