import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { dashboardService } from "@/server/services/dashboard.service";

// GET /api/v1/dashboard/stats — aggregate KPIs for the dashboard.
export const GET = route({ permission: "dashboard:view" }, async () => {
  const stats = await dashboardService.getStats();
  return ok(stats);
});

export const runtime = "nodejs";
