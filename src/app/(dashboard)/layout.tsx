import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Authenticated layout for all (dashboard) routes. Guards on the server (Node
 * runtime) then renders the AppShell (sidebar + topbar) around the page.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return (
    <AppShell user={{ name: user.name ?? "User", email: user.email ?? "", role: user.role }}>
      {children}
    </AppShell>
  );
}
