import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MoreVertical, Trash2, Copy, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCENT_CLASSES, getNodeDefinition } from "@/lib/workflow/node-catalog";
import { summarizeConfig, type FlowNodeData } from "@/lib/workflow/convert";
import type { StepRunStatus } from "@/types/run";

export type NodeActions = {
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onConfigure: (id: string) => void;
};

/** Injected once by the canvas so nodes stay presentational. */
let nodeActions: NodeActions | null = null;
export function registerNodeActions(actions: NodeActions): void {
  nodeActions = actions;
}

const RUN_STATE: Record<StepRunStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Waiting", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  running: { label: "Running", dot: "bg-primary animate-pulse", text: "text-primary" },
  paused: { label: "Paused", dot: "bg-warning", text: "text-warning" },
  completed: { label: "Completed", dot: "bg-success", text: "text-success" },
  failed: { label: "Failed", dot: "bg-destructive", text: "text-destructive" },
  skipped: { label: "Skipped", dot: "bg-border-strong", text: "text-muted-foreground" },
};

export function NodeShell({
  id,
  data,
  selected,
  children,
  className,
}: {
  id: string;
  data: FlowNodeData;
  selected: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const def = getNodeDefinition(data.kind);
  const accent = ACCENT_CLASSES[def.accent];
  const state = data.runStatus ? RUN_STATE[data.runStatus] : null;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            "w-60 rounded-md border bg-card shadow-node transition-[box-shadow,border-color,transform] duration-150",
            selected
              ? "border-primary ring-1 ring-primary/40"
              : "border-border hover:border-border-strong",
            data.runStatus === "running" && "node-running",
            data.runStatus === "failed" && "border-destructive/60",
            className,
          )}
        >
          <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
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
              <span className={cn("block text-tech truncate", accent.text)}>{def.label}</span>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-sm p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-surface-raised hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100 [.react-flow__node:hover_&]:opacity-100"
                aria-label="Node actions"
              >
                <MoreVertical className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={() => nodeActions?.onConfigure(id)}>
                  <Settings2 className="size-3.5" /> Configure
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => nodeActions?.onDuplicate(id)}>
                  <Copy className="size-3.5" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => nodeActions?.onDelete(id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-1 px-2.5 py-2.5">
            <p className="truncate text-sm font-medium text-foreground">{data.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {summarizeConfig(data.kind, data.config)}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border px-2.5 py-1.5">
            {state ? (
              <span className={cn("flex items-center gap-1.5 text-xs", state.text)}>
                <span className={cn("size-1.5 rounded-full", state.dot)} />
                {data.runSummary ?? state.label}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                Ready
              </span>
            )}
            {data.runDurationMs != null && (
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {(data.runDurationMs / 1000).toFixed(2)}s
              </span>
            )}
          </div>
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40">
        <ContextMenuItem onSelect={() => nodeActions?.onConfigure(id)}>
          <Settings2 className="size-3.5" /> Configure
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => nodeActions?.onDuplicate(id)}>
          <Copy className="size-3.5" /> Duplicate
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => nodeActions?.onDelete(id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-3.5" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** Standard action / approval step: one input, one output. */
export function StepNode({ id, data, selected }: NodeProps) {
  const nodeData = data as FlowNodeData;
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell id={id} data={nodeData} selected={Boolean(selected)} />
      <Handle type="source" position={Position.Right} />
    </>
  );
}
