"use client";

import * as React from "react";
import { Menu } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import type { RoleName } from "@/types/api";

interface AppShellProps {
  user: { name: string; email: string; role: RoleName };
  children: React.ReactNode;
}

/**
 * The authenticated app frame: fixed sidebar (desktop), slide-in sidebar
 * (mobile via Dialog), sticky topbar, and scrollable main content.
 */
export function AppShell({ user, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/60 via-background to-violet-50/40 dark:from-slate-950 dark:via-background dark:to-indigo-950/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card/80 backdrop-blur-sm lg:block">
        <SidebarNav role={user.role} />
      </aside>

      {/* Mobile sidebar */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="left-0 top-0 h-full max-w-64 translate-x-0 translate-y-0 rounded-none border-r p-0 sm:rounded-none">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Breadcrumbs />
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu name={user.name} email={user.email} role={user.role} />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
