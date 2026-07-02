import { FeedbackType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Data access for message-level feedback. */
export class FeedbackRepository {
  findByMessageAndUser(messageId: string, userId: string) {
    return prisma.feedback.findFirst({ where: { messageId, userId } });
  }

  create(data: { messageId: string; userId: string; type: FeedbackType; comment?: string }) {
    return prisma.feedback.create({ data });
  }

  update(id: string, data: { type: FeedbackType; comment?: string }) {
    return prisma.feedback.update({ where: { id }, data });
  }

  async list(page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { name: true } },
          message: {
            select: {
              content: true,
              conversationId: true,
              conversation: { select: { assistant: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.feedback.count(),
    ]);
    return { items, total };
  }
}

export const feedbackRepository = new FeedbackRepository();
