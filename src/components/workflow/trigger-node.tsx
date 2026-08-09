import { Handle, Position, type NodeProps } from "@xyflow/react";

import { NodeShell } from "./workflow-node";
import type { FlowNodeData } from "@/lib/workflow/convert";

/** Trigger nodes have no input handle — they start the graph. */
export function TriggerNode({ id, data, selected }: NodeProps) {
  const nodeData = data as FlowNodeData;
  return (
    <>
      <NodeShell id={id} data={nodeData} selected={Boolean(selected)} className="border-dashed" />
      <Handle type="source" position={Position.Right} />
    </>
  );
}
