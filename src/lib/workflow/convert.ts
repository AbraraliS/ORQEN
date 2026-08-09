import type { Edge, Node } from "@xyflow/react";

import { getNodeDefinition } from "./node-catalog";
import type {
  NodeKind,
  StepConfig,
  Workflow,
  WorkflowEdgeRow,
  WorkflowStep,
} from "@/types/workflow";
import type { StepRunStatus } from "@/types/run";

/** Data carried by every React Flow node in the editor. */
export type FlowNodeData = {
  kind: NodeKind;
  name: string;
  config: StepConfig;
  runStatus?: StepRunStatus;
  runDurationMs?: number | null;
  runSummary?: string | null;
};

export type FlowNode = Node<FlowNodeData>;

/** DB model -> React Flow graph */
export function workflowToFlow(workflow: Workflow): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = workflow.steps.map((step) => ({
    id: step.id,
    type: getNodeDefinition(step.kind).flowType,
    position: { x: step.positionX, y: step.positionY },
    data: { kind: step.kind, name: step.name, config: step.config },
  }));

  const edges: Edge[] = workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: "smoothstep",
    ...(edge.sourceHandle === "true"
      ? { label: "TRUE" }
      : edge.sourceHandle === "false"
        ? { label: "FALSE" }
        : {}),
  }));

  return { nodes, edges };
}

/**
 * React Flow graph -> DB model.
 * Steps are ordered topologically so the execution engine can consume an
 * ordered `workflow_steps` list.
 */
export function flowToWorkflow(
  workflow: Pick<Workflow, "id" | "organizationId">,
  nodes: FlowNode[],
  edges: Edge[],
): { steps: WorkflowStep[]; edges: WorkflowEdgeRow[] } {
  const order = topologicalOrder(nodes, edges);

  const steps: WorkflowStep[] = nodes.map((node) => ({
    id: node.id,
    workflowId: workflow.id,
    kind: node.data.kind,
    name: node.data.name,
    order: order.indexOf(node.id),
    positionX: Math.round(node.position.x),
    positionY: Math.round(node.position.y),
    config: node.data.config,
  }));

  const edgeRows: WorkflowEdgeRow[] = edges.map((edge) => ({
    id: edge.id,
    workflowId: workflow.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
  }));

  return { steps: steps.sort((a, b) => a.order - b.order), edges: edgeRows };
}

function topologicalOrder(nodes: FlowNode[], edges: Edge[]): string[] {
  const indegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const adjacency = new Map<string, string[]>(nodes.map((n) => [n.id, []]));

  for (const edge of edges) {
    if (!indegree.has(edge.target) || !adjacency.has(edge.source)) continue;
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    adjacency.get(edge.source)!.push(edge.target);
  }

  const queue = nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  const result: string[] = [];

  while (queue.length) {
    const id = queue.shift()!;
    result.push(id);
    for (const next of adjacency.get(id) ?? []) {
      const remaining = (indegree.get(next) ?? 1) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  // cycles: append leftovers so no node is lost
  for (const node of nodes) if (!result.includes(node.id)) result.push(node.id);
  return result;
}

/** Simple deterministic layered layout (left-to-right by depth). */
export function autoLayout(nodes: FlowNode[], edges: Edge[]): FlowNode[] {
  const depth = new Map<string, number>();
  const order = topologicalOrder(nodes, edges);

  for (const id of order) {
    const incoming = edges.filter((e) => e.target === id);
    const d = incoming.length
      ? Math.max(...incoming.map((e) => (depth.get(e.source) ?? 0) + 1))
      : 0;
    depth.set(id, d);
  }

  const perDepth = new Map<number, number>();
  return nodes.map((node) => {
    const d = depth.get(node.id) ?? 0;
    const index = perDepth.get(d) ?? 0;
    perDepth.set(d, index + 1);
    return { ...node, position: { x: 80 + d * 300, y: 80 + index * 180 } };
  });
}

export function createStepId(kind: NodeKind): string {
  return `${kind}-${Math.random().toString(36).slice(2, 9)}`;
}

export function summarizeConfig(kind: NodeKind, config: StepConfig): string {
  const c = config as Record<string, unknown>;
  switch (kind) {
    case "llm_call":
      return String(c["model"] ?? "");
    case "http_request":
      return `${String(c["method"] ?? "GET")} ${shorten(String(c["url"] ?? ""))}`;
    case "db_write":
      return String(c["table"] ?? "");
    case "notify":
      return `${String(c["channel"] ?? "")} → ${String(c["recipient"] ?? "")}`;
    case "conditional_branch":
      return `${String(c["field"] ?? "").replace("previous.output.", "")} ${String(c["operator"] ?? "")} ${String(c["value"] ?? "")}`;
    case "approval_gate":
      return `${String(c["requiredRole"] ?? "editor")} approval required`;
    case "webhook":
      return `POST ${shorten(String(c["path"] ?? ""))}`;
    case "scheduled":
      return `cron ${String(c["cron"] ?? "")}`;
    case "database_event":
      return `${String(c["event"] ?? "")} on ${String(c["table"] ?? "")}`;
    case "manual":
      return "Triggered by a member";
    default:
      return "";
  }
}

function shorten(value: string, max = 28): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
