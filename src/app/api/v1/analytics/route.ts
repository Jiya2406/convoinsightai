import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { analyticsService } from "@/server/services/analytics.service";

// GET /api/v1/analytics — trends + per-assistant/provider/governance breakdowns.
export const GET = route({ permission: "analytics:view" }, async ({ searchParams }) => {
  const windowDays = Number(searchParams.get("windowDays")) || 30;
  const data = await analyticsService.getAnalytics(windowDays);
  return ok(data);
});

export const runtime = "nodejs";
