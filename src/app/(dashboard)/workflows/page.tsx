"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useOrg } from "@/lib/auth/org-context";
import { canEditWorkflow } from "@/lib/permissions";
import { stepCount, useWorkflows } from "@/hooks/use-workflow";

export default function WorkflowsPage() {
  const { organization, role } = useOrg();
  const { workflows, createWorkflow } = useWorkflows(organization?.id || "");
  const [query, setQuery] = useState("");
  const editable = canEditWorkflow(role);

  if (!organization) return null;

  const filtered = workflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell
      title="Workflows"
      crumbs={[{ label: "Workflows" }]}
      search={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search workflows…"
      actions={
        <Button size="sm" disabled={!editable} onClick={() => createWorkflow("Untitled workflow")}>
          <Plus className="size-3.5" /> New workflow
        </Button>
      }
    >
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-tech text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-normal">Name</th>
                <th className="px-4 py-2.5 text-left font-normal">Status</th>
                <th className="hidden px-4 py-2.5 text-left font-normal md:table-cell">Trigger</th>
                <th className="hidden px-4 py-2.5 text-left font-normal md:table-cell">Steps</th>
                <th className="px-4 py-2.5 text-left font-normal">Last run</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((workflow) => (
                <tr key={workflow.id} className="transition-colors hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link
                      href={`/workflows/${workflow.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {workflow.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{workflow.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-tech text-muted-foreground">{workflow.status}</span>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                    {workflow.triggerType}
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums md:table-cell">
                    {stepCount(workflow)}
                  </td>
                  <td className="px-4 py-3">
                    {workflow.lastRunStatus ? (
                      <StatusBadge status={workflow.lastRunStatus} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Never</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No workflows match “{query}”.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
