import { useMemo } from "react";
import { useSubscription } from "@apollo/client";

import { WORKFLOW_RUN_SUBSCRIPTION } from "@/lib/graphql/documents";
import { useWorkflowRun } from "./use-workflow-run";
import type { RunStatus, StepRun, WorkflowRun } from "@/types/run";

type RunRow = {
  id: string;
  status: RunStatus;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  step_runs: Array<{
    id: string;
    step_id: string;
    step_name: string;
    step_kind: StepRun["stepKind"];
    status: StepRun["status"];
    input: unknown;
    output: unknown;
    error: string | null;
    attempt_count: number;
    duration_ms: number | null;
    started_at: string | null;
    finished_at: string | null;
    approval_required_role: "owner" | "editor" | null;
    approval_reason: string | null;
    approval_decision: "approved" | "rejected" | null;
    approval_decided_by: string | null;
  }>;
};

function mapStepRuns(runId: string, rows: RunRow["step_runs"]): StepRun[] {
  if (!rows) return [];
  return rows.map((row) => ({
    id: row.id,
    runId,
    stepId: row.step_id,
    stepName: row.step_name,
    stepKind: row.step_kind,
    status: row.status,
    input: row.input,
    output: row.output,
    error: row.error,
    attemptCount: row.attempt_count,
    durationMs: row.duration_ms,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    approval: row.approval_required_role
      ? {
          requiredRole: row.approval_required_role,
          reason: row.approval_reason ?? "",
          decision: row.approval_decision,
          decidedBy: row.approval_decided_by,
        }
      : null,
  }));
}

/**
 * Live run + step_runs updates via GraphQL subscriptions.
 */
export function useWorkflowRunSubscription(runId: string): {
  run: WorkflowRun | null;
  live: boolean;
  loading: boolean;
  error: Error | null;
} {
  const fallback = useWorkflowRun(runId);

  const { data, loading, error } = useSubscription<{ workflow_runs_by_pk: RunRow }>(
    WORKFLOW_RUN_SUBSCRIPTION,
    { variables: { runId }, skip: !runId },
  );

  const row = data?.workflow_runs_by_pk;

  const liveRun = useMemo<Partial<WorkflowRun> | null>(() => {
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      durationMs: row.duration_ms,
      stepRuns: mapStepRuns(row.id, row.step_runs),
    };
  }, [row]);

  const run = useMemo<WorkflowRun | null>(() => {
    if (!fallback.run) return null;
    return liveRun ? ({ ...fallback.run, ...liveRun } as WorkflowRun) : fallback.run;
  }, [fallback.run, liveRun]);

  return {
    run,
    live: !!data,
    loading: fallback.loading || loading,
    error: (error as Error | undefined) ?? fallback.error ?? null,
  };
}
