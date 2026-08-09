import { Handle, Position, type NodeProps } from "@xyflow/react";

import { NodeShell } from "./workflow-node";
import type { ConditionalConfig } from "@/types/workflow";
import type { FlowNodeData } from "@/lib/workflow/convert";

/** Conditional branch: one input, two labelled outputs (TRUE / FALSE). */
export function ConditionalNode({ id, data, selected }: NodeProps) {
  const nodeData = data as FlowNodeData;
  const config = nodeData.config as ConditionalConfig;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <NodeShell id={id} data={nodeData} selected={Boolean(selected)}>
        <div className="grid grid-cols-2 divide-x divide-border border-t border-border">
          <div className="px-2.5 py-1.5 text-center">
            <span className="text-tech text-success">true</span>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {config.operator} {config.value}
            </p>
          </div>
          <div className="px-2.5 py-1.5 text-center">
            <span className="text-tech text-muted-foreground">false</span>
            <p className="truncate font-mono text-[10px] text-muted-foreground">otherwise</p>
          </div>
        </div>
      </NodeShell>
      <Handle
        id="true"
        type="source"
        position={Position.Right}
        style={{ top: "62%" }}
        className="!bg-success/80"
      />
      <Handle id="false" type="source" position={Position.Bottom} style={{ left: "75%" }} />
    </>
  );
}
