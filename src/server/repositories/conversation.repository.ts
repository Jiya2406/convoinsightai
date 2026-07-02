import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface ConversationListFilter {
  page: number;
  pageSize: number;
  assistantId?: string;
  q?: string;
}

/** Data access for Conversations + their Messages. */
export class ConversationRepository {
  async list(filter: ConversationListFilter) {
    const where: Prisma.ConversationWhereInput = {
      ...(filter.assistantId ? { assistantId: filter.assistantId } : {}),
      ...(filter.q ? { title: { contains: filter.q, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          assistant: { select: { id: true, name: true, domain: true } },
          user: { select: { id: true, name: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      prisma.conversation.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        assistant: { select: { id: true, name: true, domain: true } },
        user: { select: { id: true, name: true } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { evaluation: true, feedback: true },
        },
      },
    });
  }

  /** Lightweight lookup used to validate a conversation before appending to it. */
  findLight(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      select: { id: true, assistantId: true },
    });
  }

  createConversation(assistantId: string, userId: string | undefined, title: string) {
    return prisma.conversation.create({
      data: { assistantId, userId, title },
      select: { id: true },
    });
  }

  createUserMessage(conversationId: string, content: string) {
    return prisma.message.create({
      data: { conversationId, role: "USER", content },
    });
  }

  /** Persist the assistant reply together with its evaluation in one write. */
  createAssistantMessage(data: {
    conversationId: string;
    content: string;
    tokens: number;
    latencyMs: number;
    sources: Prisma.InputJsonValue;
    governanceStatus: Prisma.MessageCreateInput["governanceStatus"];
    governanceReasons: Prisma.InputJsonValue;
    evaluation: Prisma.EvaluationUncheckedCreateWithoutMessageInput;
  }) {
    return prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: "ASSISTANT",
        content: data.content,
        tokens: data.tokens,
        latencyMs: data.latencyMs,
        sources: data.sources,
        governanceStatus: data.governanceStatus,
        governanceReasons: data.governanceReasons,
        evaluation: { create: data.evaluation },
      },
      include: { evaluation: true },
    });
  }
}

export const conversationRepository = new ConversationRepository();
