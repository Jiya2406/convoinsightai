import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Data access for user notifications. */
export class NotificationRepository {
  create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  }

  listForUser(userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  unreadCount(userId: string) {
    return prisma.notification.count({
      where: { isRead: false, OR: [{ userId }, { userId: null }] },
    });
  }

  markRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { isRead: false, OR: [{ userId }, { userId: null }] },
      data: { isRead: true },
    });
  }
}

export const notificationRepository = new NotificationRepository();
