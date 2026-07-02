import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { notificationService } from "@/server/services/notification.service";

// POST /api/v1/notifications/read-all — mark all of the user's notifications read.
export const POST = route({ permission: "dashboard:view" }, async ({ session }) => {
  await notificationService.markAllRead(session.user.id);
  return ok({ ok: true });
});

export const runtime = "nodejs";
