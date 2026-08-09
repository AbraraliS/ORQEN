"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSignOut } from "@nhost/nextjs";
import { LogOut, Search, User as UserIcon } from "lucide-react";
import type { ReactNode } from "react";

import { OrqenLogo } from "@/components/brand/orqen-logo";
import { RoleBadge } from "@/components/layout/role-badge";
import { UsageMeter } from "@/components/layout/usage-meter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useOrg } from "@/lib/auth/org-context";
import type { Role } from "@/types/organization";

export type Crumb = { label: string; to?: string };

export function TopBar({
  title,
  crumbs = [],
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  actions,
}: {
  title: string;
  crumbs?: Crumb[];
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
}) {
  const { organization } = useOrg();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur">
      <div className="min-w-0 flex-1">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            {organization?.name || "Workspace"}
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb.label} className="flex items-center gap-1.5">
              <span className="text-border-strong">/</span>
              {crumb.to ? (
                <Link href={crumb.to} className="hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="truncate text-sm font-medium text-foreground">{title}</h1>
      </div>

      {onSearchChange && (
        <div className="relative hidden w-64 md:block">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 bg-surface pl-8 text-sm"
          />
        </div>
      )}

      <div className="hidden xl:block">
        {organization && <UsageMeter usage={organization.usage} variant="inline" />}
      </div>

      {actions}
      <UserMenu />
    </header>
  );
}

function UserMenu() {
  const { user, role, setRole } = useOrg();
  const { signOut } = useSignOut();
  const router = useRouter();
  const initials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-sm border border-border bg-surface text-xs font-medium"
        >
          {initials}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate text-sm">{user?.name || "User"}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {user?.email || ""}
              </span>
            </span>
            <RoleBadge role={role} />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-tech text-muted-foreground">
          Preview as role
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={role} onValueChange={(value) => setRole(value as Role)}>
          <DropdownMenuRadioItem value="owner">Owner</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="editor">Editor</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="viewer">Viewer</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserIcon className="size-3.5" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await signOut();
            router.replace("/login");
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MobileNav() {
  const pathname = usePathname() || "";
  const items = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/workflows", label: "Workflows" },
    { to: "/runs", label: "Runs" },
    { to: "/settings", label: "Settings" },
  ] as const;

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-sidebar px-3 py-2 lg:hidden">
      <OrqenLogo variant="mark" height={28} className="mr-3 shrink-0" />
      {items.map((item) => (
        <Link
          key={item.to}
          href={item.to}
          className={
            (item.to === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.to))
              ? "rounded-sm bg-primary/10 px-2.5 py-1 text-xs text-foreground"
              : "rounded-sm px-2.5 py-1 text-xs text-muted-foreground"
          }
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
