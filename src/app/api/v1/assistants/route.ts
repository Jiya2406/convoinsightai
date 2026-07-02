import { route } from "@/lib/api/handler";
import { created, paginated } from "@/lib/api/response";
import { parsePagination, parseBoolean } from "@/lib/validation/common";
import { createAssistantSchema } from "@/lib/validation/assistant.schema";
import { assistantService } from "@/server/services/assistant.service";

// GET /api/v1/assistants — list (any authenticated user).
export const GET = route({ permission: "dashboard:view" }, async ({ searchParams }) => {
  const { page, pageSize } = parsePagination(searchParams);
  const { items, meta } = await assistantService.list({
    page,
    pageSize,
    q: searchParams.get("q") ?? undefined,
    domain: searchParams.get("domain") ?? undefined,
    isActive: parseBoolean(searchParams.get("isActive")),
  });
  return paginated(items, meta);
});

// POST /api/v1/assistants — create (admins only).
export const POST = route({ permission: "assistant:manage" }, async ({ req, session }) => {
  const body = createAssistantSchema.parse(await req.json());
  const assistant = await assistantService.create(body, session.user.id);
  return created(assistant);
});

// Ensure this route always runs on the Node runtime (Prisma).
export const runtime = "nodejs";
