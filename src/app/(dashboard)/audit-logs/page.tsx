"use client";

import * as React from "react";
import { ScrollText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { useAuditLogs } from "@/lib/api-client/hooks";
import { formatDate } from "@/lib/format";
import type { AuditLogItem } from "@/types/api";

export default function AuditLogsPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useAuditLogs({ page, pageSize: 15 });

  const columns: Column<AuditLogItem>[] = [
    {
      key: "actor",
      header: "Actor",
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{a.user?.name ?? "System"}</p>
          <p className="truncate text-xs text-muted-foreground">{a.user?.email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (a) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.action}</code>
      ),
    },
    { key: "entity", header: "Entity", render: (a) => <Badge variant="secondary">{a.entity}</Badge> },
    {
      key: "entityId",
      header: "Entity ID",
      className: "hidden lg:table-cell",
      render: (a) => (
        <span className="font-mono text-xs text-muted-foreground">{a.entityId ?? "—"}</span>
      ),
    },
    {
      key: "when",
      header: "When",
      render: (a) => <span className="text-sm text-muted-foreground">{formatDate(a.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of every mutating action, with the actor and timestamp."
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.data}
          loading={isLoading}
          rowKey={(a) => a.id}
          emptyTitle="No audit entries"
          emptyDescription="Actions like creating or editing assistants are recorded here."
          meta={data?.meta}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
