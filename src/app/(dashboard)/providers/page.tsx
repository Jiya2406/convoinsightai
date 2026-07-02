"use client";

import { toast } from "sonner";
import { Boxes, Power } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProviders, useUpdateProvider } from "@/lib/api-client/hooks";
import { usePermissions } from "@/lib/auth/use-permissions";
import { ApiClientError } from "@/lib/api-client/client";
import type { Provider } from "@/types/api";

export default function ProvidersPage() {
  const { can } = usePermissions();
  const canManage = can("provider:manage");
  const { data, isLoading, isError, refetch } = useProviders();
  const update = useUpdateProvider();

  async function toggle(p: Provider) {
    try {
      await update.mutateAsync({ id: p.id, payload: { isActive: !p.isActive } });
      toast.success(`${p.name} ${p.isActive ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to update provider");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Providers"
        description="AI providers behind your assistants. Mock is the default; Gemini is wired for the free tier."
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
            : data?.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                        <Boxes className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                    </div>
                    {p.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : p.isScaffold ? (
                      <Badge variant="muted">Scaffold</Badge>
                    ) : (
                      <Badge variant="secondary">Idle</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <dl className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Key</dt>
                        <dd className="font-mono text-xs">{p.key}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Assistants</dt>
                        <dd>{p._count?.assistants ?? 0}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Status</dt>
                        <dd>{p.isScaffold ? "Scaffolded (not wired)" : "Wired"}</dd>
                      </div>
                    </dl>

                    {canManage && !p.isScaffold && (
                      <Button
                        variant={p.isActive ? "outline" : "default"}
                        size="sm"
                        className="w-full"
                        onClick={() => toggle(p)}
                        disabled={update.isPending}
                      >
                        <Power className="h-4 w-4" />
                        {p.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                    {p.isScaffold && (
                      <p className="text-xs text-muted-foreground">
                        Scaffolded via the AI adapter — enable by wiring its adapter in a later phase.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>
      )}
    </div>
  );
}
