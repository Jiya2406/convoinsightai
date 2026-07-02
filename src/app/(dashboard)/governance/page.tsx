"use client";

import * as React from "react";
import { toast } from "sonner";
import { ShieldCheck, Plus, Trash2, Power } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/error-state";
import { RuleDialog } from "@/components/features/governance/rule-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGovernanceRules,
  useUpdateGovernanceRule,
  useDeleteGovernanceRule,
} from "@/lib/api-client/hooks";
import { usePermissions } from "@/lib/auth/use-permissions";
import { ApiClientError } from "@/lib/api-client/client";
import type { GovernanceRule } from "@/types/api";

const TYPE_LABELS: Record<GovernanceRule["type"], string> = {
  GROUNDING: "Grounding required",
  THRESHOLD: "Hallucination threshold",
  BANNED_WORD: "Banned words",
  PII: "PII detection",
};

export default function GovernancePage() {
  const { can } = usePermissions();
  const canManage = can("governance:manage");
  const { data, isLoading, isError, refetch } = useGovernanceRules();
  const update = useUpdateGovernanceRule();
  const del = useDeleteGovernanceRule();
  const [createOpen, setCreateOpen] = React.useState(false);

  async function toggle(rule: GovernanceRule) {
    try {
      await update.mutateAsync({ id: rule.id, payload: { isActive: !rule.isActive } });
      toast.success(`Rule ${rule.isActive ? "disabled" : "enabled"}`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to update rule");
    }
  }

  async function remove(rule: GovernanceRule) {
    try {
      await del.mutateAsync(rule.id);
      toast.success("Rule deleted");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to delete rule");
    }
  }

  const columns: Column<GovernanceRule>[] = [
    {
      key: "name",
      header: "Rule",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{r.name}</p>
          <p className="text-xs text-muted-foreground">{TYPE_LABELS[r.type]}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (r) =>
        r.action === "BLOCK" ? (
          <Badge variant="destructive">Block</Badge>
        ) : (
          <Badge variant="warning">Flag</Badge>
        ),
    },
    {
      key: "scope",
      header: "Scope",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.assistant?.name ?? "All assistants"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Disabled</Badge>,
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      render: (r) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => toggle(r)} aria-label="Toggle" disabled={update.isPending}>
              <Power className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => remove(r)}
              aria-label="Delete"
              disabled={del.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Governance"
        description="Rules applied to every generated response — grounding, hallucination limits, banned words, and PII."
        actions={
          canManage ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New rule
            </Button>
          ) : undefined
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={data}
          loading={isLoading}
          rowKey={(r) => r.id}
          emptyTitle="No governance rules"
          emptyDescription={canManage ? "Create a rule to start governing responses." : undefined}
        />
      )}

      <RuleDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
