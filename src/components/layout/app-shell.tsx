import type { ReactNode } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav, TopBar, type Crumb } from "@/components/layout/top-bar";

export function AppShell({
  title,
  crumbs,
  search,
  onSearchChange,
  searchPlaceholder,
  actions,
  children,
  padded = true,
}: {
  title: string;
  crumbs?: Crumb[];
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav />
        <TopBar
          title={title}
          {...(crumbs ? { crumbs } : {})}
          {...(search !== undefined ? { search } : {})}
          {...(onSearchChange ? { onSearchChange } : {})}
          {...(searchPlaceholder ? { searchPlaceholder } : {})}
          {...(actions ? { actions } : {})}
        />
        <main className={padded ? "flex-1 overflow-y-auto p-6" : "flex min-h-0 flex-1 flex-col"}>
          {children}
        </main>
      </div>
    </div>
  );
}
