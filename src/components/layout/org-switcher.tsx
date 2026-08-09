import { Building2, Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/layout/role-badge";
import { useOrg } from "@/lib/auth/org-context";

export function OrgSwitcher() {
  const { organizations, organization, switchOrganization, user, role } = useOrg();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-between gap-2 rounded-md border border-sidebar-border bg-surface px-2.5 py-2 hover:bg-surface-raised"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-sm border border-border bg-surface-raised">
              <Building2 className="size-3.5 text-primary" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium text-foreground">
                {organization?.name || "Workspace"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user?.name || "User"} · {role}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-tech text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => switchOrganization(org.id)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <Building2 className="size-3.5 text-muted-foreground" />
              {org.name}
            </span>
            {org.id === organization?.id && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
          <RoleBadge role={role} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
