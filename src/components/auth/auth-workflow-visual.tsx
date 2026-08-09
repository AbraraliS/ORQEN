"use client";

import { motion } from "framer-motion";
import {
  MousePointerClick,
  Sparkles,
  GitBranch,
  Globe,
  Bell,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const nodes = [
  {
    id: "trigger",
    label: "Trigger",
    icon: MousePointerClick,
    x: 0,
    y: 0,
    status: "done",
    color: "text-slate-400",
    bg: "bg-slate-900/80",
    border: "border-slate-800",
  },
  {
    id: "ai",
    label: "Gemini AI",
    icon: Sparkles,
    x: 0,
    y: 72,
    status: "active",
    color: "text-cyan-400",
    bg: "bg-cyan-950/20",
    border: "border-cyan-800/40",
  },
  {
    id: "condition",
    label: "Condition",
    icon: GitBranch,
    x: 0,
    y: 144,
    status: "pending",
    color: "text-violet-400",
    bg: "bg-violet-950/20",
    border: "border-violet-800/40",
  },
  {
    id: "api",
    label: "HTTP",
    icon: Globe,
    x: -80,
    y: 216,
    status: "pending",
    color: "text-emerald-400",
    bg: "bg-emerald-950/20",
    border: "border-emerald-800/40",
  },
  {
    id: "notify",
    label: "Notify",
    icon: Bell,
    x: 80,
    y: 216,
    status: "pending",
    color: "text-amber-400",
    bg: "bg-amber-950/20",
    border: "border-amber-800/40",
  },
  {
    id: "approval",
    label: "Approval",
    icon: ShieldCheck,
    x: 0,
    y: 288,
    status: "pending",
    color: "text-orange-400",
    bg: "bg-orange-950/20",
    border: "border-orange-800/40",
  },
];

const edges = [
  { id: "e1", from: "trigger", to: "ai", path: "M 0 36 L 0 72" },
  { id: "e2", from: "ai", to: "condition", path: "M 0 108 L 0 144" },
  { id: "e3", from: "condition", to: "api", path: "M 0 180 L 0 198 L -80 198 L -80 216" },
  { id: "e4", from: "condition", to: "notify", path: "M 0 180 L 0 198 L 80 198 L 80 216" },
  { id: "e5", from: "api", to: "approval", path: "M -80 252 L -80 270 L 0 270 L 0 288" },
  { id: "e6", from: "notify", to: "approval", path: "M 80 252 L 80 270 L 0 270 L 0 288" },
];

export function AuthWorkflowVisual() {
  return (
    <div className="w-full max-w-[360px] rounded-xl border border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <span className="text-xs font-medium text-white/70">Workflow Preview</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
          </span>
          <span className="text-[10px] font-medium text-cyan-400 uppercase tracking-wider">
            Executing
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex items-center justify-center h-[360px] w-full select-none pt-4 pb-4">
        <div className="relative w-full h-full max-w-[300px]">
          {/* Edges */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ transform: "translate(50%, 0)" }}
          >
            {edges.map((edge) => (
              <g key={edge.id}>
                {/* Base line */}
                <path
                  d={edge.path}
                  fill="none"
                  stroke="currentColor"
                  className="text-white/10"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
                {/* Animated pulse (only on active path) */}
                {(edge.from === "trigger" || edge.from === "ai") && (
                  <motion.path
                    d={edge.path}
                    fill="none"
                    stroke="currentColor"
                    className="text-cyan-400/80"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: edge.from === "trigger" ? 0 : 0.75,
                    }}
                  />
                )}
              </g>
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map((node, i) => {
            const Icon = node.icon;
            const isActive = node.status === "active";
            const isDone = node.status === "done";

            return (
              <motion.div
                key={node.id}
                className={`absolute left-1/2 flex items-center justify-center p-2 rounded-lg border backdrop-blur-md shadow-xl
                  ${node.bg} ${node.border} ${isActive ? "ring-1 ring-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.15)]" : ""}
                `}
                style={{
                  width: 130,
                  x: "-50%",
                  translateX: node.x,
                  y: node.y,
                }}
                initial={{ opacity: 0, y: node.y + 10 }}
                animate={{ opacity: 1, y: node.y }}
                transition={{ delay: i * 0.1, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 w-full">
                  <div className={`p-1.5 rounded-md bg-black/50 ${node.color}`}>
                    <Icon size={14} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-medium text-white/90 truncate">{node.label}</span>
                  {isDone && <CheckCircle2 size={12} className="ml-auto text-white/30" />}
                  {isActive && (
                    <span className="relative flex h-1.5 w-1.5 ml-auto mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
