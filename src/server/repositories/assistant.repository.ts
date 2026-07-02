import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface AssistantListFilter {
  page: number;
  pageSize: number;
  q?: string;
  domain?: string;
  isActive?: boolean;
}

/**
 * Data access for Assistants. All Prisma access for this entity lives here;
 * services never call Prisma directly (Repository Pattern).
 */
export class AssistantRepository {
  private readonly withProvider = {
    provider: { select: { id: true, key: true, name: true } },
  } satisfies Prisma.AssistantInclude;

  async list(filter: AssistantListFilter) {
    const where: Prisma.AssistantWhereInput = {
      ...(filter.q
        ? {
            OR: [
              { name: { contains: filter.q, mode: "insensitive" } },
              { description: { contains: filter.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filter.domain ? { domain: filter.domain } : {}),
      ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.assistant.findMany({
        where,
        include: this.withProvider,
        orderBy: { createdAt: "desc" },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      prisma.assistant.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return prisma.assistant.findUnique({
      where: { id },
      include: {
        ...this.withProvider,
        knowledge: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          take: 1,
          include: { documents: { select: { id: true, title: true, type: true } } },
        },
      },
    });
  }

  /** Load an assistant with its provider + active knowledge documents (with content) for generation. */
  findForGeneration(id: string) {
    return prisma.assistant.findUnique({
      where: { id },
      include: {
        provider: { select: { id: true, key: true, name: true, isActive: true } },
        knowledge: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          take: 1,
          include: {
            documents: { select: { id: true, title: true, content: true } },
          },
        },
      },
    });
  }

  create(data: Prisma.AssistantUncheckedCreateInput) {
    return prisma.assistant.create({ data, include: this.withProvider });
  }

  update(id: string, data: Prisma.AssistantUncheckedUpdateInput) {
    return prisma.assistant.update({ where: { id }, data, include: this.withProvider });
  }

  delete(id: string) {
    return prisma.assistant.delete({ where: { id } });
  }
}

export const assistantRepository = new AssistantRepository();
