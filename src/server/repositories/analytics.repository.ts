import { prisma } from "@/lib/db/prisma";

/** Aggregate read queries for the Analytics page. */
export class AnalyticsRepository {
  /** Evaluations (with assistant + provider context) created since `since`. */
  evaluationsSince(since: Date) {
    return prisma.evaluation.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        correctnessScore: true,
        hallucinationRisk: true,
        confidence: true,
        message: {
          select: {
            conversation: {
              select: {
                assistant: {
                  select: {
                    id: true,
                    name: true,
                    provider: { select: { key: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /** Count assistant messages grouped by governance status. */
  governanceCounts() {
    return prisma.message.groupBy({
      by: ["governanceStatus"],
      where: { role: "ASSISTANT" },
      _count: { _all: true },
    });
  }
}

export const analyticsRepository = new AnalyticsRepository();
