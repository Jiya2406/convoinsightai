import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { updateProviderSchema } from "@/lib/validation/provider.schema";
import { providerService } from "@/server/services/provider.service";

// GET /api/v1/providers/:id — detail.
export const GET = route({ permission: "dashboard:view" }, async ({ params }) => {
  const provider = await providerService.getById(params.id);
  return ok(provider);
});

// PATCH /api/v1/providers/:id — toggle active / update config (admins only).
export const PATCH = route({ permission: "provider:manage" }, async ({ req, params, session }) => {
  const body = updateProviderSchema.parse(await req.json());
  const provider = await providerService.update(params.id, body, session.user.id);
  return ok(provider);
});

export const runtime = "nodejs";
