"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Play, Settings, Workflow } from "lucide-react";

import { cn } from "@/lib/utils";
import { OrqenLogo } from "@/components/brand/orqen-logo";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { UsageMeter } from "@/components/layout/usage-meter";
import { useOrg } from "@/lib/auth/org-context";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/workflows", label: "Workflows", icon: Workflow, exact: false },
  { to: "/runs", label: "Runs", icon: Play, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AppSidebar() {
  const { organization } = useOrg();
  const pathname = usePathname() || "";

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      {/* Full wordmark in expanded sidebar */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <OrqenLogo variant="full" height={26} priority />
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        <p className="text-tech px-2 py-2 text-muted-foreground">Workspace</p>
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "group flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <item.icon
                className={cn("size-4", active ? "text-primary" : "text-muted-foreground")}
              />
              {item.label}
              {active && <span className="ml-auto h-4 w-0.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border p-2">
        {organization && <UsageMeter usage={organization.usage} variant="compact" />}
        <OrgSwitcher />
      </div>
    </aside>
  );
}
