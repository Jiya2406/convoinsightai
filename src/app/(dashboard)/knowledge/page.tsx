"use client";

import * as React from "react";
import { toast } from "sonner";
import { BookOpen, Plus, FileText, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AssistantPicker } from "@/components/shared/assistant-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateVersionDialog } from "@/components/features/knowledge/create-version-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useKnowledgeVersions,
  useKnowledge,
  useActivateKnowledge,
} from "@/lib/api-client/hooks";
import { usePermissions } from "@/lib/auth/use-permissions";
import { ApiClientError } from "@/lib/api-client/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function KnowledgePage() {
  const { can } = usePermissions();
  const canManage = can("knowledge:manage");

  const [assistantId, setAssistantId] = React.useState("");
  const [selectedVersion, setSelectedVersion] = React.useState<string | undefined>();
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data: versions, isLoading } = useKnowledgeVersions(assistantId || undefined);
  const activeVersionId = versions?.find((v) => v.isActive)?.id;
  const currentId = selectedVersion ?? activeVersionId ?? versions?.[0]?.id;
  const { data: detail } = useKnowledge(currentId);
  const activate = useActivateKnowledge();

  // Reset selection when assistant changes.
  React.useEffect(() => setSelectedVersion(undefined), [assistantId]);

  async function onActivate(id: string) {
    try {
      await activate.mutateAsync(id);
      toast.success("Version activated");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to activate");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge"
        description="Manage the versioned knowledge each assistant grounds its answers on."
        actions={
          <div className="flex items-center gap-2">
            <AssistantPicker value={assistantId} onChange={setAssistantId} activeOnly={false} />
            {canManage && assistantId && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> New version
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Versions list */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Versions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : versions && versions.length > 0 ? (
              versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                    currentId === v.id && "border-primary",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      v{v.version} · {v.name}
                    </span>
                    {v.isActive && <Badge variant="success">Active</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {v._count?.documents ?? 0} documents · {formatDate(v.createdAt)}
                  </p>
                </button>
              ))
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No knowledge yet"
                description={canManage ? "Create the first version." : "Nothing to show."}
              />
            )}
          </CardContent>
        </Card>

        {/* Documents of selected version */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {detail ? `Documents — v${detail.version}` : "Documents"}
            </CardTitle>
            {detail && !detail.isActive && canManage && (
              <Button size="sm" variant="outline" onClick={() => onActivate(detail.id)} disabled={activate.isPending}>
                <CheckCircle2 className="h-4 w-4" /> Activate this version
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {detail ? (
              detail.documents.length > 0 ? (
                detail.documents.map((d) => (
                  <div key={d.id} className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{d.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{d.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.content}</p>
                  </div>
                ))
              ) : (
                <EmptyState title="No documents in this version" />
              )
            ) : (
              <EmptyState
                icon={BookOpen}
                title="Select an assistant and version"
                description="Choose an assistant above to view its knowledge."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {assistantId && (
        <CreateVersionDialog assistantId={assistantId} open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>
  );
}
