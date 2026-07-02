"use client";

import * as React from "react";
import Link from "next/link";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { useFeedbackList } from "@/lib/api-client/hooks";
import { formatDate } from "@/lib/format";
import type { FeedbackListItem } from "@/types/api";

export default function FeedbackPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useFeedbackList({ page, pageSize: 15 });

  const columns: Column<FeedbackListItem>[] = [
    {
      key: "type",
      header: "Rating",
      render: (f) =>
        f.type === "UP" ? (
          <Badge variant="success" className="gap-1"><ThumbsUp className="h-3 w-3" /> Up</Badge>
        ) : (
          <Badge variant="destructive" className="gap-1"><ThumbsDown className="h-3 w-3" /> Down</Badge>
        ),
    },
    {
      key: "response",
      header: "Response",
      render: (f) => (
        <Link href={`/conversations/${f.message.conversationId}`} className="block max-w-xs truncate text-sm hover:underline">
          {f.message.content}
        </Link>
      ),
    },
    {
      key: "comment",
      header: "Comment",
      className: "hidden md:table-cell",
      render: (f) => <span className="text-sm text-muted-foreground">{f.comment || "—"}</span>,
    },
    { key: "assistant", header: "Assistant", render: (f) => <span className="text-sm">{f.message.conversation.assistant.name}</span> },
    { key: "user", header: "By", className: "hidden lg:table-cell", render: (f) => <span className="text-sm text-muted-foreground">{f.user?.name ?? "—"}</span> },
    { key: "when", header: "When", className: "hidden md:table-cell", render: (f) => <span className="text-sm text-muted-foreground">{formatDate(f.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Feedback" description="Human ratings on assistant responses." />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.data}
          loading={isLoading}
          rowKey={(f) => f.id}
          emptyTitle="No feedback yet"
          emptyDescription="Rate responses in the Playground or a conversation to see them here."
          meta={data?.meta}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
