import {
  analyticsRepository,
  AnalyticsRepository,
} from "@/server/repositories/analytics.repository";
import type { AnalyticsData } from "@/types/api";

const DEFAULT_WINDOW_DAYS = 30;

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Computes analytics (trends + breakdowns) live from evaluation data. */
export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository = analyticsRepository) {}

  async getAnalytics(windowDays = DEFAULT_WINDOW_DAYS): Promise<AnalyticsData> {
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const [evals, governance] = await Promise.all([
      this.repo.evaluationsSince(since),
      this.repo.governanceCounts(),
    ]);

    // ── Trend by day ──
    const byDay = new Map<string, { c: number; h: number; n: number }>();
    // ── Per assistant ──
    const byAssistant = new Map<string, { name: string; c: number; h: number; n: number }>();
    // ── Per provider ──
    const byProvider = new Map<string, { name: string; c: number; n: number }>();

    let totalC = 0;
    let totalH = 0;

    for (const e of evals) {
      const day = e.createdAt.toISOString().slice(0, 10);
      const d = byDay.get(day) ?? { c: 0, h: 0, n: 0 };
      d.c += e.correctnessScore;
      d.h += e.hallucinationRisk;
      d.n += 1;
      byDay.set(day, d);

      totalC += e.correctnessScore;
      totalH += e.hallucinationRisk;

      const assistant = e.message?.conversation?.assistant;
      if (assistant) {
        const a = byAssistant.get(assistant.id) ?? { name: assistant.name, c: 0, h: 0, n: 0 };
        a.c += e.correctnessScore;
        a.h += e.hallucinationRisk;
        a.n += 1;
        byAssistant.set(assistant.id, a);

        const provider = assistant.provider;
        if (provider) {
          const p = byProvider.get(provider.key) ?? { name: provider.name, c: 0, n: 0 };
          p.c += e.correctnessScore;
          p.n += 1;
          byProvider.set(provider.key, p);
        }
      }
    }

    return {
      windowDays,
      totals: {
        evaluations: evals.length,
        avgCorrectness: evals.length ? round(totalC / evals.length) : 0,
        avgHallucination: evals.length ? round(totalH / evals.length) : 0,
      },
      trend: [...byDay.entries()].map(([date, v]) => ({
        date,
        avgCorrectness: round(v.c / v.n),
        avgHallucination: round(v.h / v.n),
        count: v.n,
      })),
      perAssistant: [...byAssistant.entries()]
        .map(([id, v]) => ({
          id,
          name: v.name,
          avgCorrectness: round(v.c / v.n),
          avgHallucination: round(v.h / v.n),
          evaluations: v.n,
        }))
        .sort((a, b) => b.evaluations - a.evaluations),
      perProvider: [...byProvider.entries()].map(([key, v]) => ({
        key,
        name: v.name,
        evaluations: v.n,
        avgCorrectness: round(v.c / v.n),
      })),
      governance: governance.map((g) => ({
        status: g.governanceStatus,
        count: g._count._all,
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
