import { route } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { notificationService } from "@/server/services/notification.service";

// GET /api/v1/notifications — current user's notifications + unread count.
export const GET = route({ permission: "dashboard:view" }, async ({ session }) => {
  const [items, unread] = await Promise.all([
    notificationService.list(session.user.id),
    notificationService.unreadCount(session.user.id),
  ]);
  return ok({ items, unread });
});

export const runtime = "nodejs";
