"use client";

import { useSession } from "next-auth/react";
import { can, type Permission } from "@/lib/auth/rbac";
import type { RoleName } from "@/types/api";

/** Client-side permission check based on the current session's role. */
export function usePermissions() {
  const { data } = useSession();
  const role = (data?.user?.role ?? null) as RoleName | null;
  return {
    role,
    can: (permission: Permission) => can(role, permission),
  };
}
