import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatMs } from "@/lib/format";
import type { EvaluationResult, SourceRef } from "@/types/api";

/** A metric bar: label + value + colored progress. */
function Metric({
  label,
  value,
  invert,
}: {
  label: string;
  value: number;
  invert?: boolean; // for hallucination risk (lower is better)
}) {
  // Good = green, mid = amber, bad = red. Invert flips the scale.
  const good = invert ? value <= 30 : value >= 70;
  const mid = invert ? value <= 60 : value >= 40;
  const color = good ? "bg-emerald-500" : mid ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** Live evaluation panel showing all 10 metrics + sources. */
export function EvaluationCard({
  evaluation,
  sources,
}: {
  evaluation: EvaluationResult;
  sources?: SourceRef[];
}) {
  const srcs = sources ?? evaluation.sourceReference;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm">Response Evaluation</CardTitle>
        <Badge variant="secondary" className="text-[10px]">{evaluation.evaluator} evaluator</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">{evaluation.correctnessScore}</span>
          <span className="text-xs text-muted-foreground">/ 100 correctness score</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Metric label="Accuracy" value={evaluation.accuracy} />
          <Metric label="Relevance" value={evaluation.relevance} />
          <Metric label="Completeness" value={evaluation.completeness} />
          <Metric label="Confidence" value={evaluation.confidence} />
          <Metric label="Hallucination Risk" value={evaluation.hallucinationRisk} invert />
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Grounded</span>
            <div>
              {evaluation.groundedSource ? (
                <Badge variant="success" className="text-[10px]">Yes</Badge>
              ) : (
                <Badge variant="warning" className="text-[10px]">No</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
          <span>Latency: <span className="font-medium text-foreground">{formatMs(evaluation.latencyMs)}</span></span>
          <span>Length: <span className="font-medium text-foreground">{evaluation.responseLength} chars</span></span>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Grounded sources</p>
          {srcs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {srcs.map((s) => (
                <Badge key={s.id} variant="outline" className="gap-1 text-[10px]">
                  {s.title}
                  <span className="text-muted-foreground">· {Math.round(s.score * 100)}%</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No sources referenced.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
