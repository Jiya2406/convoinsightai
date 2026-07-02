import type { RoleName } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors/api-error";

/**
 * Central RBAC definition.
 *
 * Permissions are coarse-grained capability keys. Roles map to a set of
 * permissions. Services/API routes check `can(role, permission)` rather than
 * hard-coding role names, so adding a role later only changes this file.
 */
export type Permission =
  | "dashboard:view"
  | "analytics:view"
  | "playground:use"
  | "assistant:manage"
  | "knowledge:manage"
  | "provider:manage"
  | "prompt:test"
  | "evaluation:manage"
  | "feedback:create"
  | "governance:manage"
  | "audit:view"
  | "user:manage"
  | "settings:manage";

const ALL: Permission[] = [
  "dashboard:view",
  "analytics:view",
  "playground:use",
  "assistant:manage",
  "knowledge:manage",
  "provider:manage",
  "prompt:test",
  "evaluation:manage",
  "feedback:create",
  "governance:manage",
  "audit:view",
  "user:manage",
  "settings:manage",
];

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  ADMIN: ALL,
  REVIEWER: [
    "dashboard:view",
    "analytics:view",
    "playground:use",
    "prompt:test",
    "evaluation:manage",
    "feedback:create",
    "audit:view",
  ],
  ANALYST: ["dashboard:view", "analytics:view", "audit:view"],
};

/** Returns true if the given role holds the permission. */
export function can(role: RoleName | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Throwing guard for use inside services/route handlers. */
export function assertCan(role: RoleName | undefined | null, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(permission);
  }
}

export { ForbiddenError };
