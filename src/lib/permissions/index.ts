import type { Role } from "@/types/organization";
import type { NodeKind } from "@/types/workflow";

/**
 * Frontend permission helpers — UX only.
 * The Hasura/Nhost backend remains the authoritative authorization layer.
 */

const RANK: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 };

export const PRIVILEGED_STEPS: NodeKind[] = ["db_write", "notify", "webhook"];

export function canViewWorkflow(role: Role): boolean {
  return RANK[role] >= RANK.viewer;
}

export function canEditWorkflow(role: Role): boolean {
  return RANK[role] >= RANK.editor;
}

export function canRunWorkflow(role: Role): boolean {
  return RANK[role] >= RANK.editor;
}

export function canApproveStep(role: Role, requiredRole: "owner" | "editor"): boolean {
  return RANK[role] >= RANK[requiredRole];
}

export function canManagePrivilegedStep(role: Role, kind: NodeKind): boolean {
  if (!PRIVILEGED_STEPS.includes(kind)) return canEditWorkflow(role);
  return role === "owner";
}

export function canManageMembers(role: Role): boolean {
  return role === "owner";
}

export function roleLabel(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
