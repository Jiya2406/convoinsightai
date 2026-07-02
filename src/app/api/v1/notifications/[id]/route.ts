import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { notificationService } from "@/server/services/notification.service";

// PATCH /api/v1/notifications/:id — mark a notification as read.
export const PATCH = route({ permission: "dashboard:view" }, async ({ params }) => {
  const notification = await notificationService.markRead(params.id);
  return ok(notification);
});

export const runtime = "nodejs";
