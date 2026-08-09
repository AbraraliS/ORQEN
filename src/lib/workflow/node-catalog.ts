import {
  Bell,
  Database,
  GitBranch,
  Globe,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Timer,
  Webhook,
  type LucideIcon,
} from "lucide-react";

import type { NodeCategory, NodeKind, StepConfig } from "@/types/workflow";

export type NodeDefinition = {
  kind: NodeKind;
  label: string;
  category: NodeCategory;
  icon: LucideIcon;
  /** visual accent per category/kind */
  accent: "cyan" | "violet" | "amber" | "emerald" | "slate";
  hint: string;
  defaultName: string;
  privileged?: boolean;
  defaultConfig: () => StepConfig;
  /** React Flow node type used to render this kind */
  flowType: "trigger" | "conditional" | "step";
};

export const NODE_DEFINITIONS: NodeDefinition[] = [
  {
    kind: "manual",
    label: "Manual",
    category: "trigger",
    icon: MousePointerClick,
    accent: "slate",
    hint: "Start a run by hand",
    defaultName: "Manual Trigger",
    flowType: "trigger",
    defaultConfig: () => ({ enabled: true }),
  },
  {
    kind: "webhook",
    label: "Webhook",
    category: "trigger",
    icon: Webhook,
    accent: "slate",
    hint: "HTTP POST starts the run",
    defaultName: "Webhook Trigger",
    privileged: true,
    flowType: "trigger",
    defaultConfig: () => ({
      path: "/api/webhooks/new-workflow",
      secret: "whsec_ak31f9c02b7d4e18",
      enabled: true,
    }),
  },
  {
    kind: "scheduled",
    label: "Scheduled",
    category: "trigger",
    icon: Timer,
    accent: "slate",
    hint: "Run on a cron schedule",
    defaultName: "Scheduled Trigger",
    flowType: "trigger",
    defaultConfig: () => ({ cron: "0 9 * * 1-5", timezone: "UTC", enabled: true }),
  },
  {
    kind: "database_event",
    label: "Database Event",
    category: "trigger",
    icon: Database,
    accent: "slate",
    hint: "React to row changes",
    defaultName: "Database Event",
    flowType: "trigger",
    defaultConfig: () => ({ table: "public.tickets", event: "INSERT", enabled: true }),
  },
  {
    kind: "llm_call",
    label: "LLM Call",
    category: "action",
    icon: Sparkles,
    accent: "violet",
    hint: "Prompt a model, get structured output",
    defaultName: "New LLM Step",
    flowType: "step",
    defaultConfig: () => ({
      provider: "google",
      model: "gemini-2.5-flash",
      systemPrompt: "You are a precise classification engine. Reply with JSON only.",
      userPrompt: "Classify the following message:\n{{input.message}}",
      temperature: 0.2,
      maxTokens: 1024,
    }),
  },
  {
    kind: "http_request",
    label: "HTTP Request",
    category: "action",
    icon: Globe,
    accent: "cyan",
    hint: "Call an external API",
    defaultName: "New HTTP Request",
    flowType: "step",
    defaultConfig: () => ({
      method: "POST",
      url: "https://api.example.com/v1/resource",
      headers: [{ key: "Content-Type", value: "application/json" }],
      queryParams: [],
      body: '{\n  "payload": "{{previous.output}}"\n}',
      timeoutMs: 10000,
      retryCount: 2,
    }),
  },
  {
    kind: "db_write",
    label: "DB Write",
    category: "action",
    icon: Database,
    accent: "emerald",
    hint: "Insert or update rows",
    defaultName: "New DB Write",
    privileged: true,
    flowType: "step",
    defaultConfig: () => ({
      table: "public.classifications",
      mapping: [{ column: "priority", value: "{{previous.output.priority}}" }],
    }),
  },
  {
    kind: "notify",
    label: "Notify",
    category: "action",
    icon: Bell,
    accent: "amber",
    hint: "Send a message to a channel",
    defaultName: "New Notification",
    privileged: true,
    flowType: "step",
    defaultConfig: () => ({
      channel: "slack",
      recipient: "#ops-alerts",
      message: "Workflow update: {{previous.output}}",
    }),
  },
  {
    kind: "conditional_branch",
    label: "Conditional Branch",
    category: "logic",
    icon: GitBranch,
    accent: "cyan",
    hint: "Split the graph on a condition",
    defaultName: "New Condition",
    flowType: "conditional",
    defaultConfig: () => ({ field: "previous.output.priority", operator: "==", value: "HIGH" }),
  },
  {
    kind: "approval_gate",
    label: "Approval Gate",
    category: "logic",
    icon: ShieldCheck,
    accent: "amber",
    hint: "Pause until a human approves",
    defaultName: "New Approval Gate",
    flowType: "step",
    defaultConfig: () => ({
      message: "Review before continuing.",
      requiredRole: "editor",
    }),
  },
];

const BY_KIND = new Map(NODE_DEFINITIONS.map((d) => [d.kind, d]));

export function getNodeDefinition(kind: NodeKind): NodeDefinition {
  const def = BY_KIND.get(kind);
  if (!def) throw new Error(`Unknown node kind: ${kind}`);
  return def;
}

export const TRIGGER_KINDS: NodeKind[] = ["manual", "webhook", "scheduled", "database_event"];

export function isTriggerKind(kind: NodeKind): boolean {
  return TRIGGER_KINDS.includes(kind);
}

export const ACCENT_CLASSES: Record<
  NodeDefinition["accent"],
  { text: string; bg: string; border: string; dot: string }
> = {
  cyan: {
    text: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/40",
    dot: "bg-primary",
  },
  violet: {
    text: "text-ai",
    bg: "bg-ai/10",
    border: "border-ai/40",
    dot: "bg-ai",
  },
  amber: {
    text: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/40",
    dot: "bg-warning",
  },
  emerald: {
    text: "text-success",
    bg: "bg-success/10",
    border: "border-success/40",
    dot: "bg-success",
  },
  slate: {
    text: "text-muted-foreground",
    bg: "bg-muted/60",
    border: "border-border-strong",
    dot: "bg-muted-foreground",
  },
};

export const VARIABLE_SUGGESTIONS = [
  "{{previous.output}}",
  "{{input.customer}}",
  "{{input.message}}",
  "{{trigger.receivedAt}}",
];
