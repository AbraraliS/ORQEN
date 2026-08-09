/** Domain model for workflows. Kept independent of React Flow internals. */

export type TriggerType = "manual" | "webhook" | "scheduled" | "database_event";

export type StepType =
  "llm_call" | "http_request" | "db_write" | "notify" | "conditional_branch" | "approval_gate";

export type NodeKind = TriggerType | StepType;

export type WorkflowStatus = "active" | "paused" | "draft" | "archived";

export type NodeCategory = "trigger" | "action" | "logic";

export type LlmConfig = {
  provider: "google" | "openai" | "anthropic";
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
};

export type HttpConfig = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers: Array<{ key: string; value: string }>;
  queryParams: Array<{ key: string; value: string }>;
  body: string;
  timeoutMs: number;
  retryCount: number;
};

export type DbWriteConfig = {
  table: string;
  mapping: Array<{ column: string; value: string }>;
};

export type NotifyConfig = {
  channel: "slack" | "email" | "webhook";
  recipient: string;
  message: string;
};

export type ConditionalConfig = {
  field: string;
  operator: "==" | "!=" | ">" | "<" | "contains" | "exists";
  value: string;
};

export type ApprovalConfig = {
  message: string;
  requiredRole: "owner" | "editor";
};

export type TriggerConfig = {
  /** webhook */
  path?: string;
  secret?: string;
  enabled?: boolean;
  /** scheduled */
  cron?: string;
  timezone?: string;
  /** database_event */
  table?: string;
  event?: "INSERT" | "UPDATE" | "DELETE";
};

export type StepConfig =
  | LlmConfig
  | HttpConfig
  | DbWriteConfig
  | NotifyConfig
  | ConditionalConfig
  | ApprovalConfig
  | TriggerConfig;

/** Persisted step row (compatible with an ordered `workflow_steps` table). */
export type WorkflowStep = {
  id: string;
  workflowId: string;
  kind: NodeKind;
  name: string;
  order: number;
  positionX: number;
  positionY: number;
  config: StepConfig;
};

/** Persisted edge row (`workflow_edges`). */
export type WorkflowEdgeRow = {
  id: string;
  workflowId: string;
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
};

export type Workflow = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  triggerType: TriggerType;
  steps: WorkflowStep[];
  edges: WorkflowEdgeRow[];
  updatedAt: string;
  createdAt: string;
  lastRunAt: string | null;
  lastRunStatus: import("./run").RunStatus | null;
};
