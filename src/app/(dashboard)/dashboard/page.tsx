"use client";

import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, Plus, Zap } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { UsageMeter } from "@/components/layout/usage-meter";
import { useOrg } from "@/lib/auth/org-context";
import { useRuns } from "@/hooks/use-workflow-run";
import { useWorkflows } from "@/hooks/use-workflow";

export default function Dashboard() {
  const { organization, user } = useOrg();
  const { workflows } = useWorkflows(organization?.id || "");
  const { runs } = useRuns(organization?.id || "");

  const completed = runs.filter((run: any) => run.status === "completed").length;
  const successRate = runs.length ? Math.round((completed / runs.length) * 100) : 0;
  const active = workflows.filter((workflow: any) => workflow.status === "active").length;

  if (!organization || !user) return null;

  return (
    <AppShell
      title="Dashboard"
      actions={
        <Button asChild size="sm">
          <Link href="/workflows">
            <Plus className="size-3.5" /> New workflow
          </Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h2 className="text-lg font-medium text-foreground">
            Welcome back, {user.name.split(" ")[0]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {active} active workflows · {runs.length} runs in the current period
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Zap} label="Active workflows" value={String(active)} />
          <Stat icon={Activity} label="Total runs" value={String(runs.length)} />
          <Stat icon={CheckCircle2} label="Success rate" value={`${successRate}%`} />
          <div className="rounded-md border border-border bg-card p-4">
            <UsageMeter usage={organization.usage} variant="full" />
          </div>
        </div>

        <section className="rounded-md border border-border bg-card">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium text-foreground">Recent runs</h3>
            <Link
              href="/runs"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </header>
          <ul className="divide-y divide-border">
            {runs.slice(0, 6).map((run: any) => (
              <li key={run.id}>
                <Link
                  href={`/runs/${run.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface"
                >
                  <StatusBadge status={run.status} />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {run.workflowName}
                  </span>
                  <span className="hidden font-mono text-xs text-muted-foreground sm:block">
                    #{run.shortId}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" />
        <span className="text-tech">{label}</span>
      </div>
      <p className="mt-2 font-mono text-2xl text-foreground tabular-nums">{value}</p>
    </div>
  );
}
