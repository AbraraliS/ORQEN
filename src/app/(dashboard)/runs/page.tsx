"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { useOrg } from "@/lib/auth/org-context";
import { useRuns } from "@/hooks/use-workflow-run";

export default function RunsPage() {
  const { organization } = useOrg();
  const { runs } = useRuns(organization?.id || "");

  if (!organization) return null;

  return (
    <AppShell title="Runs" crumbs={[{ label: "Runs" }]}>
      <div className="mx-auto max-w-6xl overflow-hidden rounded-md border border-border bg-card">
        <ul className="divide-y divide-border">
          {runs.map((run: any) => (
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
                  {run.triggerType}
                </span>
                <span className="font-mono text-xs text-muted-foreground">#{run.shortId}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
