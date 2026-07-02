import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { can, type Permission } from "@/lib/auth/rbac";

/**
 * Server-side session helpers. We guard protected pages/layouts by calling
 * these in Server Components (Node runtime) rather than in edge middleware,
 * which avoids running Prisma/bcrypt on the edge.
 */

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Redirects to /login if not authenticated; otherwise returns the user. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects to /login if unauthenticated, or /dashboard if lacking permission. */
export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect("/dashboard");
  return user;
}
