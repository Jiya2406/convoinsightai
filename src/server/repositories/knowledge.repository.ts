import { prisma } from "@/lib/db/prisma";

/** Data access for versioned Knowledge + its Documents. */
export class KnowledgeRepository {
  listByAssistant(assistantId: string) {
    return prisma.knowledge.findMany({
      where: { assistantId },
      orderBy: { version: "desc" },
      include: { _count: { select: { documents: true } } },
    });
  }

  findById(id: string) {
    return prisma.knowledge.findUnique({
      where: { id },
      include: { documents: { orderBy: { createdAt: "asc" } } },
    });
  }

  async nextVersion(assistantId: string): Promise<number> {
    const latest = await prisma.knowledge.findFirst({
      where: { assistantId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return (latest?.version ?? 0) + 1;
  }

  /** Create a new version (optionally activating it, deactivating others). */
  createWithDocuments(params: {
    assistantId: string;
    name: string;
    version: number;
    activate: boolean;
    documents: { type: "JSON" | "TEXT" | "PDF"; title: string; content: string }[];
  }) {
    return prisma.$transaction(async (tx) => {
      if (params.activate) {
        await tx.knowledge.updateMany({
          where: { assistantId: params.assistantId },
          data: { isActive: false },
        });
      }
      return tx.knowledge.create({
        data: {
          assistantId: params.assistantId,
          name: params.name,
          version: params.version,
          isActive: params.activate,
          documents: {
            create: params.documents.map((d) => ({
              type: d.type,
              title: d.title,
              content: d.content,
            })),
          },
        },
        include: { documents: true, _count: { select: { documents: true } } },
      });
    });
  }

  setActive(id: string, assistantId: string) {
    return prisma.$transaction([
      prisma.knowledge.updateMany({ where: { assistantId }, data: { isActive: false } }),
      prisma.knowledge.update({ where: { id }, data: { isActive: true } }),
    ]);
  }
}

export const knowledgeRepository = new KnowledgeRepository();
