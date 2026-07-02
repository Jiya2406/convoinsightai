import { route } from "@/lib/api/handler";
import { ok, noContent } from "@/lib/api/response";
import { updateAssistantSchema } from "@/lib/validation/assistant.schema";
import { assistantService } from "@/server/services/assistant.service";

// GET /api/v1/assistants/:id — detail.
export const GET = route({ permission: "dashboard:view" }, async ({ params }) => {
  const assistant = await assistantService.getById(params.id);
  return ok(assistant);
});

// PATCH /api/v1/assistants/:id — update (admins only).
export const PATCH = route({ permission: "assistant:manage" }, async ({ req, params, session }) => {
  const body = updateAssistantSchema.parse(await req.json());
  const assistant = await assistantService.update(params.id, body, session.user.id);
  return ok(assistant);
});

// DELETE /api/v1/assistants/:id — delete (admins only).
export const DELETE = route({ permission: "assistant:manage" }, async ({ params, session }) => {
  await assistantService.remove(params.id, session.user.id);
  return noContent();
});

export const runtime = "nodejs";
