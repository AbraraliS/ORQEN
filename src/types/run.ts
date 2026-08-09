import type { StepType, TriggerType } from "./workflow";

export type RunStatus = "pending" | "running" | "paused" | "completed" | "failed";

export type StepRunStatus = RunStatus | "skipped";

export type StepRun = {
  id: string;
  runId: string;
  stepId: string;
  stepName: string;
  stepKind: StepType | TriggerType;
  status: StepRunStatus;
  input: unknown;
  output: unknown;
  error: string | null;
  attemptCount: number;
  durationMs: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  /** present when the step is an approval gate */
  approval: {
    requiredRole: "owner" | "editor";
    reason: string;
    decidedBy: string | null;
    decision: "approved" | "rejected" | null;
  } | null;
};

export type WorkflowRun = {
  id: string;
  shortId: string;
  workflowId: string;
  workflowName: string;
  organizationId: string;
  status: RunStatus;
  triggerType: TriggerType;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  startedBy: string;
  input: Record<string, unknown>;
  stepRuns: StepRun[];
};
