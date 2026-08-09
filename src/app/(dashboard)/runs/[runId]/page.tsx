"use client";

import { useParams } from "next/navigation";
import { Radio } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useOrg } from "@/lib/auth/org-context";
import { canApproveStep } from "@/lib/permissions";
import { useWorkflowRunSubscription } from "@/hooks/use-workflow-subscription";
import { useWorkflowRun } from "@/hooks/use-workflow-run";

export default function RunDetail() {
  const params = useParams();
  const runId = params.runId as string;
  const { role, user } = useOrg();
  const { run, live } = useWorkflowRunSubscription(runId);
  const { decideApproval } = useWorkflowRun(runId);

  if (!user || !role) return null;

  if (!run) {
    return (
      <AppShell title="Run" crumbs={[{ label: "Runs", to: "/runs" }]}>
        <p className="text-sm text-muted-foreground">This run could not be found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`${run.workflowName} · #${run.shortId}`}
      crumbs={[{ label: "Runs", to: "/runs" }, { label: `#${run.shortId}` }]}
      actions={
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Radio className={live ? "size-3.5 text-success" : "size-3.5 text-primary"} />
          {live ? "Live subscription" : "Live (mock stream)"}
        </span>
      }
    >
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
          <StatusBadge status={run.status} />
          <span className="font-mono text-xs text-muted-foreground">{run.triggerType}</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
            {run.durationMs ? `${(run.durationMs / 1000).toFixed(2)}s` : "running…"}
          </span>
        </div>

        <ol className="space-y-2">
          {run.stepRuns.map((step) => (
            <li key={step.id} className="rounded-md border border-border bg-card">
              <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
                <StatusBadge status={step.status} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {step.stepName}
                </span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {step.durationMs ? `${(step.durationMs / 1000).toFixed(2)}s` : "—"}
                </span>
              </div>
              <div className="space-y-2 px-4 py-3">
                {step.error && <p className="font-mono text-xs text-destructive">{step.error}</p>}
                <pre className="max-h-40 overflow-auto rounded-sm bg-surface p-2.5 font-mono text-xs text-muted-foreground">
                  {JSON.stringify(step.output ?? step.input ?? {}, null, 2)}
                </pre>
                {step.approval && step.status === "paused" && (
                  <div className="flex flex-wrap items-center gap-2 rounded-sm border border-warning/40 bg-warning/10 p-3">
                    <p className="min-w-0 flex-1 text-xs text-foreground">{step.approval.reason}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canApproveStep(role, step.approval.requiredRole)}
                      onClick={() => decideApproval(step.id, "rejected", user.name)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={!canApproveStep(role, step.approval.requiredRole)}
                      onClick={() => decideApproval(step.id, "approved", user.name)}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </AppShell>
  );
}
