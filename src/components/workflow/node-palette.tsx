import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { ACCENT_CLASSES, NODE_DEFINITIONS, type NodeDefinition } from "@/lib/workflow/node-catalog";
import { canManagePrivilegedStep } from "@/lib/permissions";
import { useOrg } from "@/lib/auth/org-context";
import type { NodeKind } from "@/types/workflow";

const SECTIONS: Array<{ title: string; category: NodeDefinition["category"] }> = [
  { title: "Triggers", category: "trigger" },
  { title: "Actions", category: "action" },
  { title: "Logic", category: "logic" },
];

export function NodePalette({
  onAdd,
  disabled,
  className,
}: {
  onAdd: (kind: NodeKind) => void;
  disabled: boolean;
  className?: string;
}) {
  const { role } = useOrg();

  return (
    <div className={cn("flex w-56 shrink-0 flex-col border-r border-border bg-sidebar", className)}>
      <div className="flex h-11 items-center justify-between border-b border-border px-3">
        <span className="text-sm font-medium text-foreground">Nodes</span>
        <span className="text-tech text-muted-foreground">drag</span>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-2">
        {SECTIONS.map((section) => (
          <div key={section.category} className="space-y-1">
            <p className="text-tech px-1.5 text-muted-foreground">{section.title}</p>
            {NODE_DEFINITIONS.filter((def) => def.category === section.category).map((def) => {
              const accent = ACCENT_CLASSES[def.accent];
              const locked = !canManagePrivilegedStep(role, def.kind);
              const blocked = disabled || locked;
              return (
                <button
                  key={def.kind}
                  type="button"
                  draggable={!blocked}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/Orqen-node", def.kind);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => !blocked && onAdd(def.kind)}
                  disabled={blocked}
                  title={
                    locked
                      ? "Only organization owners can add this step"
                      : disabled
                        ? "You do not have permission to edit this workflow"
                        : def.hint
                  }
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-sm border border-transparent px-1.5 py-1.5 text-left transition-colors",
                    blocked
                      ? "cursor-not-allowed opacity-45"
                      : "cursor-grab hover:border-border hover:bg-sidebar-accent active:cursor-grabbing",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-sm border",
                      accent.bg,
                      accent.border,
                    )}
                  >
                    <def.icon className={cn("size-3.5", accent.text)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{def.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{def.hint}</span>
                  </span>
                  {locked && <Lock className="size-3 shrink-0 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="border-t border-border p-3 text-xs text-muted-foreground">
        Drag a node onto the canvas, or click to append it to the graph.
      </p>
    </div>
  );
}
