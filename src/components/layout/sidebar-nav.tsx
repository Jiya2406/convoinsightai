"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { can } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RoleName } from "@/types/api";

/** The sidebar content (logo + grouped nav). Reused in desktop + mobile. */
export function SidebarNav({
  role,
  onNavigate,
}: {
  role: RoleName;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text font-semibold tracking-tight text-transparent">
          ConvoInsight
        </span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter((i) => can(role, i.permission));
          if (visible.length === 0) return null;
          return (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              {visible.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                if (item.soon) {
                  return (
                    <div
                      key={item.href}
                      className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground/60"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <Badge variant="muted" className="text-[10px]">Soon</Badge>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm"
                        : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
