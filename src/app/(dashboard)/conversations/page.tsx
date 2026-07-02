"use client";

import * as React from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useConversations } from "@/lib/api-client/hooks";
import { formatDate } from "@/lib/format";
import type { ConversationListItem } from "@/types/api";

export default function ConversationsPage() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  React.useEffect(() => setPage(1), [debouncedQ]);

  const { data, isLoading, isError, refetch } = useConversations({
    page,
    pageSize: 10,
    q: debouncedQ || undefined,
  });

  const columns: Column<ConversationListItem>[] = [
    {
      key: "title",
      header: "Conversation",
      render: (c) => (
        <Link href={`/conversations/${c.id}`} className="flex items-center gap-3 hover:underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <History className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{c.title}</span>
        </Link>
      ),
    },
    {
      key: "assistant",
      header: "Assistant",
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">{c.assistant.name}</span>
          <Badge variant="secondary">{c.assistant.domain}</Badge>
        </div>
      ),
    },
    {
      key: "messages",
      header: "Messages",
      render: (c) => <span className="text-sm">{c._count.messages}</span>,
    },
    {
      key: "user",
      header: "Started by",
      className: "hidden md:table-cell",
      render: (c) => <span className="text-sm text-muted-foreground">{c.user?.name ?? "—"}</span>,
    },
    {
      key: "created",
      header: "When",
      className: "hidden md:table-cell",
      render: (c) => <span className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description="Browse conversations across all assistants."
      />

      <Input
        placeholder="Search conversations..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="sm:max-w-xs"
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.data}
          loading={isLoading}
          rowKey={(c) => c.id}
          emptyTitle="No conversations yet"
          emptyDescription="Conversations will appear here once you use the Playground (Phase 6)."
          meta={data?.meta}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
