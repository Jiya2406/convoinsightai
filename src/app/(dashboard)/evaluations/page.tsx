"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { useEvaluations } from "@/lib/api-client/hooks";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EvaluationListItem } from "@/types/api";

function ScoreBadge({ value, invert }: { value: number; invert?: boolean }) {
  const good = invert ? value <= 30 : value >= 70;
  const mid = invert ? value <= 60 : value >= 40;
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        good ? "text-emerald-600 dark:text-emerald-400" : mid ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400",
      )}
    >
      {value}
    </span>
  );
}

export default function EvaluationsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useEvaluations({ page, pageSize: 15 });

  const columns: Column<EvaluationListItem>[] = [
    {
      key: "response",
      header: "Response",
      render: (e) => (
        <Link href={`/conversations/${e.message.conversationId}`} className="block max-w-xs truncate text-sm hover:underline">
          {e.message.content}
        </Link>
      ),
    },
    {
      key: "assistant",
      header: "Assistant",
      render: (e) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">{e.message.conversation.assistant.name}</span>
          <Badge variant="secondary" className="text-[10px]">
            {e.message.conversation.assistant.domain}
          </Badge>
        </div>
      ),
    },
    { key: "correctness", header: "Correctness", render: (e) => <ScoreBadge value={e.correctnessScore} /> },
    { key: "hallucination", header: "Hallucination", render: (e) => <ScoreBadge value={e.hallucinationRisk} invert /> },
    { key: "confidence", header: "Confidence", render: (e) => <ScoreBadge value={e.confidence} /> },
    {
      key: "grounded",
      header: "Grounded",
      render: (e) =>
        e.groundedSource ? (
          <Badge variant="success" className="text-[10px]">Yes</Badge>
        ) : (
          <Badge variant="warning" className="text-[10px]">No</Badge>
        ),
    },
    { key: "evaluator", header: "Evaluator", className: "hidden lg:table-cell", render: (e) => <Badge variant="muted" className="text-[10px]">{e.evaluator}</Badge> },
    { key: "when", header: "When", className: "hidden md:table-cell", render: (e) => <span className="text-sm text-muted-foreground">{formatDate(e.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluations"
        description="Every scored response across all assistants, with its 10-metric evaluation."
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.data}
          loading={isLoading}
          rowKey={(e) => e.id}
          emptyTitle="No evaluations yet"
          emptyDescription="Use the Playground to generate evaluated responses."
          meta={data?.meta}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
