import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { sendMessageSchema } from "@/lib/validation/playground.schema";
import { conversationService } from "@/server/services/conversation.service";

// POST /api/v1/playground — send a prompt, get a generated + evaluated + governed reply.
export const POST = route({ permission: "playground:use" }, async ({ req, session }) => {
  const body = sendMessageSchema.parse(await req.json());
  const result = await conversationService.sendMessage({
    ...body,
    userId: session.user.id,
  });
  return ok(result);
});

export const runtime = "nodejs";
