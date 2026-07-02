import { prisma } from "@/lib/db/prisma";

export interface EvaluationListFilter {
  page: number;
  pageSize: number;
  evaluator?: "MOCK" | "GEMINI";
}

/** Data access for browsing evaluations with their message + assistant context. */
export class EvaluationRepository {
  async list(filter: EvaluationListFilter) {
    const where = filter.evaluator ? { evaluator: filter.evaluator } : {};
    const [items, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
        include: {
          message: {
            select: {
              content: true,
              conversationId: true,
              conversation: { select: { assistant: { select: { name: true, domain: true } } } },
            },
          },
        },
      }),
      prisma.evaluation.count({ where }),
    ]);
    return { items, total };
  }
}

export const evaluationRepository = new EvaluationRepository();
