"use client";

import { Zap, Sparkles, Waypoints, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function Node({
  icon: Icon,
  label,
  active,
  color,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  color: string;
}) {
  return (
    <div
      className={cn(
        "flex w-32 items-center gap-3 rounded-lg border bg-black/60 p-3 shadow-lg backdrop-blur-md transition-all duration-700",
        active ? "border-white/30" : "border-white/5",
      )}
      style={{
        boxShadow: active ? `0 0 20px -5px ${color}` : "none",
      }}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-md"
        style={{
          background: `color-mix(in srgb, ${color} 20%, transparent)`,
          color: color,
        }}
      >
        <Icon size={16} />
      </div>
      <span className="text-xs font-medium text-white/90">{label}</span>
    </div>
  );
}

export function AuthVisual() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % 5); // 0, 1, 2, 3, 4(reset)
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex h-[400px] w-full max-w-[320px] flex-col items-center justify-between py-4">
      {/* Background connecting line */}
      <div className="absolute left-1/2 top-10 bottom-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      {/* Animated pulse dot traveling down */}
      <div
        className={cn(
          "absolute left-1/2 top-10 h-24 w-[2px] -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-primary to-transparent transition-all duration-[2000ms] ease-linear",
          step === 0 ? "opacity-0 translate-y-0" : "opacity-100",
        )}
        style={{
          transform: `translate(-50%, ${step * 60}px)`,
          filter: "blur(2px)",
        }}
      />

      <Node icon={Zap} label="Trigger" active={step >= 1} color="#3b82f6" />
      <Node icon={Sparkles} label="AI Agent" active={step >= 2} color="#a855f7" />
      <Node icon={Waypoints} label="Logic" active={step >= 3} color="#06b6d4" />
      <Node icon={Play} label="Execute" active={step >= 4} color="#10b981" />
    </div>
  );
}
