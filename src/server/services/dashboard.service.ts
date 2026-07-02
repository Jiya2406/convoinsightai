import {
  dashboardRepository,
  DashboardRepository,
} from "@/server/repositories/dashboard.repository";
import type { DashboardStats } from "@/types/api";

/** A message is considered "successful" when its correctness score ≥ this. */
const SUCCESS_THRESHOLD = 70;
const RECENT_ACTIVITY_LIMIT = 8;

function round(n: number | null | undefined, dp = 1): number {
  if (n == null) return 0;
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/**
 * Computes the dashboard KPIs live from current data. When there are no
 * evaluations yet, quality metrics are 0 and best/worst assistants are null,
 * which the UI renders as graceful empty states.
 */
export class DashboardService {
  constructor(private readonly repo: DashboardRepository = dashboardRepository) {}

  async getStats(): Promise<DashboardStats> {
    const [
      [conversations, assistants, activeAssistants, providers, activeProviders, messages, feedback],
      evalAgg,
      [successCount, failureCount],
      byDomain,
      providerHealth,
      mostUsed,
      evalsWithAssistant,
      recent,
    ] = await Promise.all([
      this.repo.counts(),
      this.repo.evaluationAggregates(),
      this.repo.successFailureCounts(SUCCESS_THRESHOLD),
      this.repo.assistantsByDomain(),
      this.repo.providerHealth(),
      this.repo.mostUsedAssistant(),
      this.repo.evaluationsWithAssistant(),
      this.repo.recentActivity(RECENT_ACTIVITY_LIMIT),
    ]);

    const evaluated = evalAgg._count;
    const successRate = evaluated > 0 ? round((successCount / evaluated) * 100) : 0;

    // Worst assistant by average hallucination risk (computed in-memory).
    const byAssistant = new Map<string, { name: string; sum: number; n: number }>();
    for (const e of evalsWithAssistant) {
      const a = e.message?.conversation?.assistant;
      if (!a) continue;
      const cur = byAssistant.get(a.id) ?? { name: a.name, sum: 0, n: 0 };
      cur.sum += e.hallucinationRisk;
      cur.n += 1;
      byAssistant.set(a.id, cur);
    }
    let worstAssistant: DashboardStats["worstAssistant"] = null;
    for (const [id, v] of byAssistant) {
      const avg = v.sum / v.n;
      if (!worstAssistant || avg > worstAssistant.avgHallucination) {
        worstAssistant = { id, name: v.name, avgHallucination: round(avg) };
      }
    }

    const most = mostUsed[0];

    return {
      totals: {
        conversations,
        assistants,
        activeAssistants,
        providers,
        activeProviders,
        messages,
        feedback,
      },
      quality: {
        avgConfidence: round(evalAgg._avg.confidence),
        hallucinationRate: round(evalAgg._avg.hallucinationRisk),
        successRate,
        failureRate: evaluated > 0 ? round(100 - successRate) : 0,
        avgResponseTimeMs: Math.round(evalAgg._avg.latencyMs ?? 0),
        feedbackRate: messages > 0 ? round((feedback / messages) * 100) : 0,
        evaluatedMessages: evaluated,
      },
      assistantsByDomain: byDomain.map((d) => ({ domain: d.domain, count: d._count._all })),
      providerHealth: providerHealth.map((p) => ({
        key: p.key,
        name: p.name,
        isActive: p.isActive,
        isScaffold: p.isScaffold,
        assistants: p._count.assistants,
      })),
      mostUsedAssistant: most
        ? { id: most.id, name: most.name, conversations: most._count.conversations }
        : null,
      worstAssistant,
      recentActivity: recent.map((r) => ({
        id: r.id,
        action: r.action,
        entity: r.entity,
        entityId: r.entityId,
        meta: r.meta as Record<string, unknown>,
        createdAt: r.createdAt.toISOString(),
        user: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email } : null,
      })),
    };
  }
}

export const dashboardService = new DashboardService();
