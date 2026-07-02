import { prisma } from "@/lib/db/prisma";

/**
 * Aggregate read queries for the dashboard. Kept in one repository so the
 * dashboard service just shapes the numbers into the response DTO.
 */
export class DashboardRepository {
  counts() {
    return prisma.$transaction([
      prisma.conversation.count(),
      prisma.assistant.count(),
      prisma.assistant.count({ where: { isActive: true } }),
      prisma.provider.count(),
      prisma.provider.count({ where: { isActive: true } }),
      prisma.message.count(),
      prisma.feedback.count(),
    ]);
  }

  evaluationAggregates() {
    return prisma.evaluation.aggregate({
      _avg: {
        confidence: true,
        hallucinationRisk: true,
        correctnessScore: true,
        latencyMs: true,
      },
      _count: true,
    });
  }

  successFailureCounts(threshold: number) {
    return prisma.$transaction([
      prisma.evaluation.count({ where: { correctnessScore: { gte: threshold } } }),
      prisma.evaluation.count({ where: { correctnessScore: { lt: threshold } } }),
    ]);
  }

  assistantsByDomain() {
    return prisma.assistant.groupBy({
      by: ["domain"],
      _count: { _all: true },
      orderBy: { _count: { domain: "desc" } },
    });
  }

  providerHealth() {
    return prisma.provider.findMany({
      orderBy: [{ isActive: "desc" }, { key: "asc" }],
      include: { _count: { select: { assistants: true } } },
    });
  }

  mostUsedAssistant() {
    return prisma.assistant.findMany({
      take: 1,
      orderBy: { conversations: { _count: "desc" } },
      select: { id: true, name: true, _count: { select: { conversations: true } } },
    });
  }

  /** Fetch evaluations with their assistant, to compute worst by hallucination. */
  evaluationsWithAssistant() {
    return prisma.evaluation.findMany({
      select: {
        hallucinationRisk: true,
        message: {
          select: {
            conversation: { select: { assistant: { select: { id: true, name: true } } } },
          },
        },
      },
    });
  }

  recentActivity(limit: number) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}

export const dashboardRepository = new DashboardRepository();
