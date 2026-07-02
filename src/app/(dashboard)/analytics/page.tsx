"use client";

import {
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { ClipboardCheck, Gauge, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/lib/api-client/hooks";
import { formatNumber, formatPercent } from "@/lib/format";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  fontSize: 12,
};

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useAnalytics(30);
  const hasData = (data?.totals.evaluations ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Quality trends and breakdowns across the last 30 days."
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard label="Evaluated Responses" value={formatNumber(data?.totals.evaluations ?? 0)} icon={ClipboardCheck} loading={isLoading} />
            <KpiCard label="Avg Correctness" value={formatPercent(data?.totals.avgCorrectness ?? 0)} icon={Gauge} accent="success" loading={isLoading} />
            <KpiCard label="Avg Hallucination" value={formatPercent(data?.totals.avgHallucination ?? 0)} icon={AlertTriangle} accent="warning" loading={isLoading} />
          </div>

          {/* Trend */}
          <ChartCard title="Quality Trend" description="Average correctness vs hallucination risk per day">
            {isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : hasData && data ? (
              <ResponsiveContainer width="100%" height={288}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="avgCorrectness" name="Correctness" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="avgHallucination" name="Hallucination" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No evaluation data yet" description="Use the Playground to generate evaluated responses." />
            )}
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Per assistant */}
            <ChartCard title="Correctness by Assistant">
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : hasData && data ? (
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart data={data.perAssistant} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                    <Bar dataKey="avgCorrectness" name="Correctness" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No data yet" />
              )}
            </ChartCard>

            {/* Governance distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Governance Outcomes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                ) : data && data.governance.length > 0 ? (
                  data.governance.map((g) => (
                    <div key={g.status} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <Badge variant={g.status === "BLOCK" ? "destructive" : g.status === "FLAG" ? "warning" : "success"}>
                        {g.status}
                      </Badge>
                      <span className="text-sm font-medium">{formatNumber(g.count)} responses</span>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No responses yet" />
                )}

                <div className="border-t pt-3">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Provider usage</p>
                  {data && data.perProvider.length > 0 ? (
                    <div className="space-y-1.5">
                      {data.perProvider.map((p) => (
                        <div key={p.key} className="flex items-center justify-between text-sm">
                          <span>{p.name}</span>
                          <span className="text-muted-foreground">
                            {p.evaluations} evals · {formatPercent(p.avgCorrectness)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No provider data yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
