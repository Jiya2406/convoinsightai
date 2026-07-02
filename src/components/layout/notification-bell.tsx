"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/api-client/hooks";

/** Topbar bell with an unread-count badge, linking to the notifications page. */
export function NotificationBell() {
  const { data } = useNotifications();
  const unread = data?.unread ?? 0;

  return (
    <Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
      <Link href="/notifications">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}
