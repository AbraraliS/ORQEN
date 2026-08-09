import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/permissions";
import type { Role } from "@/types/organization";

const STYLES: Record<Role, string> = {
  owner: "border-ai/40 bg-ai/10 text-ai",
  editor: "border-primary/40 bg-primary/10 text-primary",
  viewer: "border-border-strong bg-muted text-muted-foreground",
};

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        STYLES[role],
        className,
      )}
    >
      {roleLabel(role)}
    </span>
  );
}
