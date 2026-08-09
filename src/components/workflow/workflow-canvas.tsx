import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ConditionalNode } from "./conditional-node";
import { TriggerNode } from "./trigger-node";
import { StepNode, registerNodeActions } from "./workflow-node";
import { createStepId, type FlowNode } from "@/lib/workflow/convert";
import { getNodeDefinition } from "@/lib/workflow/node-catalog";
import type { NodeKind } from "@/types/workflow";

const nodeTypes = { step: StepNode, trigger: TriggerNode, conditional: ConditionalNode };

export type CanvasApi = {
  nodes: FlowNode[];
  edges: Edge[];
  addNode: (kind: NodeKind, position?: { x: number; y: number }) => void;
  updateNode: (id: string, data: Partial<FlowNode["data"]>) => void;
  removeNode: (id: string) => void;
};

export function WorkflowCanvas({
  nodes,
  edges,
  setNodes,
  setEdges,
  onNodesChange,
  onEdgesChange,
  selectedId,
  onSelect,
  editable,
}: {
  nodes: FlowNode[];
  edges: Edge[];
  setNodes: ReturnType<typeof useNodesState<FlowNode>>[1];
  setEdges: ReturnType<typeof useEdgesState>[1];
  onNodesChange: ReturnType<typeof useNodesState<FlowNode>>[2];
  onEdgesChange: ReturnType<typeof useEdgesState>[2];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  editable: boolean;
}) {
  const instance = useRef<{
    screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number };
  } | null>(null);

  const addNodeAt = useCallback(
    (kind: NodeKind, position: { x: number; y: number }) => {
      const def = getNodeDefinition(kind);
      setNodes((current) => [
        ...current,
        {
          id: createStepId(kind),
          type: def.flowType,
          position,
          data: { kind, name: def.defaultName, config: def.defaultConfig() },
        },
      ]);
    },
    [setNodes],
  );

  useEffect(() => {
    registerNodeActions({
      onConfigure: (id) => onSelect(id),
      onDelete: (id) => {
        if (!editable) return;
        setNodes((current) => current.filter((node) => node.id !== id));
        setEdges((current) => current.filter((e) => e.source !== id && e.target !== id));
        onSelect(null);
      },
      onDuplicate: (id) => {
        if (!editable) return;
        setNodes((current) => {
          const source = current.find((node) => node.id === id);
          if (!source) return current;
          return [
            ...current,
            {
              ...source,
              id: createStepId(source.data.kind),
              position: { x: source.position.x + 40, y: source.position.y + 120 },
              selected: false,
              data: { ...source.data, name: `${source.data.name} copy` },
            },
          ];
        });
      },
    });
  }, [editable, onSelect, setEdges, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!editable) return;
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            ...(connection.sourceHandle === "true"
              ? { label: "TRUE" }
              : connection.sourceHandle === "false"
                ? { label: "FALSE" }
                : {}),
          },
          current,
        ),
      );
    },
    [editable, setEdges],
  );

  const selectedNodes = useMemo<FlowNode[]>(
    () => nodes.map((node) => ({ ...node, selected: node.id === selectedId })),
    [nodes, selectedId],
  );

  const styledEdges = useMemo(
    () =>
      edges.map((edge) => ({
        ...edge,
        animated: edge.animated ?? false,
        style: { stroke: "var(--color-border-strong)", strokeWidth: 1.5, ...edge.style },
      })),
    [edges],
  );

  return (
    <div className="relative min-h-0 flex-1">
      <ReactFlow
        nodes={selectedNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={(changes) => editable && onNodesChange(changes)}
        onEdgesChange={(changes) => editable && onEdgesChange(changes)}
        onConnect={onConnect}
        onInit={(flow) => {
          instance.current = flow;
        }}
        onNodeClick={(_, node) => onSelect(node.id)}
        onPaneClick={() => onSelect(null)}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (!editable || !instance.current) return;
          const kind = event.dataTransfer.getData("application/Orqen-node") as NodeKind;
          if (!kind) return;
          const position = instance.current.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          addNodeAt(kind, position);
        }}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        fitView
        minZoom={0.25}
        maxZoom={1.8}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="var(--color-border)"
        />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap pannable zoomable maskColor="oklch(0.12 0.005 264 / 70%)" />
      </ReactFlow>
    </div>
  );
}

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
