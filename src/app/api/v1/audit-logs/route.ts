import { route } from "@/lib/api/handler";
import { paginated, buildPageMeta } from "@/lib/api/response";
import { parsePagination } from "@/lib/validation/common";
import { auditService } from "@/server/services/audit.service";

// GET /api/v1/audit-logs — read the immutable audit trail.
export const GET = route({ permission: "audit:view" }, async ({ searchParams }) => {
  const { page, pageSize } = parsePagination(searchParams);
  const { items, total } = await auditService.list({
    page,
    pageSize,
    entity: searchParams.get("entity") ?? undefined,
    userId: searchParams.get("userId") ?? undefined,
  });
  return paginated(items, buildPageMeta(page, pageSize, total));
});

export const runtime = "nodejs";
