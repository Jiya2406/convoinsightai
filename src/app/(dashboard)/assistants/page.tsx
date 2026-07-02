"use client";

import * as React from "react";
import { Plus, Bot, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssistantFormDialog } from "@/components/features/assistants/assistant-form-dialog";
import { DeleteAssistantDialog } from "@/components/features/assistants/delete-assistant-dialog";
import { useAssistants } from "@/lib/api-client/hooks";
import { usePermissions } from "@/lib/auth/use-permissions";
import { formatDate } from "@/lib/format";
import type { Assistant } from "@/types/api";

const DOMAIN_FILTERS = ["All", "HR", "Finance", "Legal", "Travel", "Support", "Sales", "IT"];

export default function AssistantsPage() {
  const { can } = usePermissions();
  const canManage = can("assistant:manage");

  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [domain, setDomain] = React.useState("All");

  // Debounce the search input.
  const [debouncedQ, setDebouncedQ] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  React.useEffect(() => setPage(1), [debouncedQ, domain]);

  const { data, isLoading, isError, refetch } = useAssistants({
    page,
    pageSize: 10,
    q: debouncedQ || undefined,
    domain: domain === "All" ? undefined : domain,
  });

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Assistant | null>(null);
  const [deleting, setDeleting] = React.useState<Assistant | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(a: Assistant) {
    setEditing(a);
    setFormOpen(true);
  }

  const columns: Column<Assistant>[] = [
    {
      key: "name",
      header: "Name",
      render: (a) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{a.name}</p>
            {a.description && (
              <p className="truncate text-xs text-muted-foreground">{a.description}</p>
            )}
          </div>
        </div>
      ),
    },
    { key: "domain", header: "Domain", render: (a) => <Badge variant="secondary">{a.domain}</Badge> },
    {
      key: "provider",
      header: "Provider",
      render: (a) => <span className="text-sm">{a.provider?.name ?? "—"}</span>,
    },
    { key: "model", header: "Model", render: (a) => <span className="text-sm">{a.model}</span> },
    {
      key: "status",
      header: "Status",
      render: (a) =>
        a.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>,
    },
    {
      key: "created",
      header: "Created",
      className: "hidden md:table-cell",
      render: (a) => <span className="text-sm text-muted-foreground">{formatDate(a.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-10 text-right",
      render: (a) =>
        canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(a)}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleting(a)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistants"
        description="Create and manage the AI assistants in your fleet."
        actions={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              New assistant
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search assistants..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOMAIN_FILTERS.map((d) => (
              <SelectItem key={d} value={d}>
                {d === "All" ? "All domains" : d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.data}
          loading={isLoading}
          rowKey={(a) => a.id}
          emptyTitle="No assistants found"
          emptyDescription={canManage ? "Create your first assistant to get started." : undefined}
          meta={data?.meta}
          onPageChange={setPage}
        />
      )}

      <AssistantFormDialog open={formOpen} onOpenChange={setFormOpen} assistant={editing} />
      <DeleteAssistantDialog assistant={deleting} onOpenChange={() => setDeleting(null)} />
    </div>
  );
}
