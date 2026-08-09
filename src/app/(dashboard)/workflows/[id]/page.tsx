"use client";

import { useParams } from "next/navigation";
import { useEdgesState, useNodesState, type Edge } from "@xyflow/react";
import { Play, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { NodePalette } from "@/components/workflow/node-palette";
import { CanvasProvider, WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { useOrg } from "@/lib/auth/org-context";
import { canEditWorkflow, canRunWorkflow } from "@/lib/permissions";
import { useWorkflow } from "@/hooks/use-workflow";
import { useStartRun } from "@/hooks/use-workflow-run";
import {
  createStepId,
  flowToWorkflow,
  workflowToFlow,
  type FlowNode,
} from "@/lib/workflow/convert";
import { getNodeDefinition } from "@/lib/workflow/node-catalog";
import type { NodeKind } from "@/types/workflow";

export default function BuilderPage() {
  const params = useParams();
  const id = params.id as string;
  const { role, user } = useOrg();
  const { workflow, save } = useWorkflow(id);
  const { startRun } = useStartRun();
  const editable = canEditWorkflow(role);

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!workflow) return;
    const flow = workflowToFlow(workflow);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [workflow, setNodes, setEdges]);

  if (!user || !role) return null;

  if (!workflow) {
    return (
      <AppShell title="Workflow" crumbs={[{ label: "Workflows", to: "/workflows" }]}>
        <p className="text-sm text-muted-foreground">This workflow no longer exists.</p>
      </AppShell>
    );
  }

  const appendNode = (kind: NodeKind) => {
    const def = getNodeDefinition(kind);
    setNodes((current) => [
      ...current,
      {
        id: createStepId(kind),
        type: def.flowType,
        position: { x: 120 + current.length * 40, y: 120 + current.length * 90 },
        data: { kind, name: def.defaultName, config: def.defaultConfig() },
      },
    ]);
  };

  return (
    <AppShell
      title={workflow.name}
      crumbs={[{ label: "Workflows", to: "/workflows" }, { label: workflow.name }]}
      padded={false}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!editable}
            onClick={() => {
              const next = flowToWorkflow(workflow, nodes, edges);
              save({ steps: next.steps, edges: next.edges });
              toast.success("Workflow saved");
            }}
          >
            <Save className="size-3.5" /> Save
          </Button>
          <Button
            size="sm"
            disabled={!canRunWorkflow(role)}
            onClick={async () => {
              const run = await startRun(id, {}, user.name);
              toast.success(run ? `Run #${run.shortId} started` : "Unable to start run");
            }}
          >
            <Play className="size-3.5" /> Run
          </Button>
        </div>
      }
    >
      <CanvasProvider>
        <div className="flex min-h-0 flex-1">
          <NodePalette onAdd={appendNode} disabled={!editable} className="hidden md:flex" />
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            selectedId={selectedId}
            onSelect={setSelectedId}
            editable={editable}
          />
        </div>
      </CanvasProvider>
    </AppShell>
  );
}
