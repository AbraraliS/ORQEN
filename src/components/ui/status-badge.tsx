import { cn } from "@/lib/utils";
import type { RunStatus, StepRunStatus } from "@/types/run";
import type { WorkflowStatus } from "@/types/workflow";

const RUN_STYLES: Record<StepRunStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Waiting", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  running: { label: "Running", dot: "bg-primary animate-pulse", text: "text-primary" },
  paused: { label: "Paused", dot: "bg-warning", text: "text-warning" },
  completed: { label: "Completed", dot: "bg-success", text: "text-success" },
  failed: { label: "Failed", dot: "bg-destructive", text: "text-destructive" },
  skipped: { label: "Skipped", dot: "bg-border-strong", text: "text-muted-foreground" },
};

const WORKFLOW_STYLES: Record<WorkflowStatus, { label: string; dot: string; text: string }> = {
  active: { label: "Active", dot: "bg-success", text: "text-success" },
  paused: { label: "Paused", dot: "bg-warning", text: "text-warning" },
  draft: { label: "Draft", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  archived: { label: "Archived", dot: "bg-border-strong", text: "text-muted-foreground" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: RunStatus | StepRunStatus | WorkflowStatus;
  className?: string;
}) {
  const style =
    status in WORKFLOW_STYLES
      ? WORKFLOW_STYLES[status as WorkflowStatus]
      : RUN_STYLES[status as StepRunStatus];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface px-2 py-0.5 text-xs font-medium",
        style.text,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}

export function statusLabel(status: RunStatus | StepRunStatus): string {
  return RUN_STYLES[status].label;
}
