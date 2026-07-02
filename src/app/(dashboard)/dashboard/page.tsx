"use client";

import {
  MessageSquare,
  Bot,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Timer,
  ThumbsUp,
  Boxes,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/lib/api-client/hooks";
import { formatNumber, formatPercent, formatMs, relativeTime } from "@/lib/format";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardStats();
  const noEvals = (data?.quality.evaluatedMessages ?? 0) === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Fleet-wide health across your AI assistants."
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total Conversations"
              value={formatNumber(data?.totals.conversations ?? 0)}
              icon={MessageSquare}
              loading={isLoading}
            />
            <KpiCard
              label="Assistants"
              value={formatNumber(data?.totals.assistants ?? 0)}
              hint={`${data?.totals.activeAssistants ?? 0} active`}
              icon={Bot}
              loading={isLoading}
            />
            <KpiCard
              label="Avg Confidence"
              value={formatPercent(data?.quality.avgConfidence ?? 0)}
              hint={noEvals ? "No evaluations yet" : undefined}
              icon={Gauge}
              accent="success"
              loading={isLoading}
            />
            <KpiCard
              label="Hallucination Rate"
              value={formatPercent(data?.quality.hallucinationRate ?? 0)}
              hint={noEvals ? "No evaluations yet" : undefined}
              icon={AlertTriangle}
              accent="warning"
              loading={isLoading}
            />
            <KpiCard
              label="Success Rate"
              value={formatPercent(data?.quality.successRate ?? 0)}
              icon={CheckCircle2}
              accent="success"
              loading={isLoading}
            />
            <KpiCard
              label="Avg Response Time"
              value={formatMs(data?.quality.avgResponseTimeMs ?? 0)}
              icon={Timer}
              loading={isLoading}
            />
            <KpiCard
              label="Feedback Rate"
              value={formatPercent(data?.quality.feedbackRate ?? 0)}
              icon={ThumbsUp}
              loading={isLoading}
            />
            <KpiCard
              label="Active Providers"
              value={formatNumber(data?.totals.activeProviders ?? 0)}
              hint={`${data?.totals.providers ?? 0} total`}
              icon={Boxes}
              loading={isLoading}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartCard
                title="Assistants by Domain"
                description="Distribution of assistants across business domains"
              >
                {isLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : data && data.assistantsByDomain.length > 0 ? (
                  <ResponsiveContainer width="100%" height={288}>
                    <BarChart data={data.assistantsByDomain}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                      <XAxis dataKey="domain" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted))" }}
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={64} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No assistants yet" description="Create an assistant to see it here." />
                )}
              </ChartCard>
            </div>

            {/* Provider health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Provider Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
                ) : (
                  data?.providerHealth.map((p) => (
                    <div key={p.key} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium">{p.name}</span>
                      {p.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : p.isScaffold ? (
                        <Badge variant="muted">Scaffold</Badge>
                      ) : (
                        <Badge variant="secondary">Idle</Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Highlights + recent activity */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <HighlightCard
                title="Most Used Assistant"
                icon={TrendingUp}
                accent="success"
                loading={isLoading}
                primary={data?.mostUsedAssistant?.name ?? "—"}
                secondary={
                  data?.mostUsedAssistant
                    ? `${formatNumber(data.mostUsedAssistant.conversations)} conversations`
                    : "No data yet"
                }
              />
              <HighlightCard
                title="Needs Attention"
                icon={TrendingDown}
                accent="destructive"
                loading={isLoading}
                primary={data?.worstAssistant?.name ?? "—"}
                secondary={
                  data?.worstAssistant
                    ? `${formatPercent(data.worstAssistant.avgHallucination)} avg hallucination`
                    : "No data yet"
                }
              />
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : data && data.recentActivity.length > 0 ? (
                    <ul className="divide-y">
                      {data.recentActivity.map((a) => (
                        <li key={a.id} className="flex items-center gap-3 py-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">
                              <span className="font-medium">{a.user?.name ?? "System"}</span>{" "}
                              <span className="text-muted-foreground">{a.action}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{a.entity}</p>
                          </div>
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {relativeTime(a.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState title="No activity yet" description="Actions will appear here." />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function HighlightCard({
  title,
  icon: Icon,
  accent,
  primary,
  secondary,
  loading,
}: {
  title: string;
  icon: typeof TrendingUp;
  accent: "success" | "destructive";
  primary: string;
  secondary: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={
            accent === "success"
              ? "flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
          }
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-6 w-28" />
          ) : (
            <>
              <p className="truncate font-semibold">{primary}</p>
              <p className="text-xs text-muted-foreground">{secondary}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
