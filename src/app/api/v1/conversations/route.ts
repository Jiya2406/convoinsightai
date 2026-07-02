import { route } from "@/lib/api/handler";
import { paginated } from "@/lib/api/response";
import { parsePagination } from "@/lib/validation/common";
import { conversationService } from "@/server/services/conversation.service";

// GET /api/v1/conversations — list (any authenticated user).
export const GET = route({ permission: "dashboard:view" }, async ({ searchParams }) => {
  const { page, pageSize } = parsePagination(searchParams);
  const { items, meta } = await conversationService.list({
    page,
    pageSize,
    assistantId: searchParams.get("assistantId") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  return paginated(items, meta);
});

export const runtime = "nodejs";
