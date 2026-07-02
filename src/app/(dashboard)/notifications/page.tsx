"use client";

import { Bell, CheckCheck, ShieldAlert, ShieldX } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/lib/api-client/hooks";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Alerts raised when responses are flagged or blocked by governance."
        actions={
          (data?.unread ?? 0) > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((n) => {
            const isBlock = n.type === "GOVERNANCE_BLOCK";
            return (
              <Card key={n.id} className={cn(!n.isRead && "border-primary/40 bg-primary/[0.03]")}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      isBlock ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {isBlock ? <ShieldX className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground">{relativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead ? (
                    <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}>
                      Mark read
                    </Button>
                  ) : (
                    <Badge variant="muted" className="text-[10px]">Read</Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Bell} title="No notifications" description="Governance alerts will appear here." />
      )}
    </div>
  );
}
