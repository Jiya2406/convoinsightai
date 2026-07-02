import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { providerService } from "@/server/services/provider.service";

// GET /api/v1/providers — list all providers + assistant counts.
export const GET = route({ permission: "dashboard:view" }, async () => {
  const providers = await providerService.list();
  return ok(providers);
});

export const runtime = "nodejs";
