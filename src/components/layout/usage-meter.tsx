import { cn } from "@/lib/utils";
import type { Organization } from "@/types/organization";

export function UsageMeter({
  usage,
  variant = "full",
  className,
}: {
  usage: Organization["usage"];
  variant?: "full" | "compact" | "inline";
  className?: string;
}) {
  const { runsUsed, runsQuota } = usage;
  const pct = Math.min(100, Math.round((runsUsed / runsQuota) * 100));
  const remaining = Math.max(0, runsQuota - runsUsed);
  const near = pct >= 80;

  const bar = (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          near ? "bg-warning" : "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <span className="text-tech text-muted-foreground">Usage</span>
        <div className="w-20">{bar}</div>
        <span
          className={cn(
            "font-mono text-xs tabular-nums",
            near ? "text-warning" : "text-muted-foreground",
          )}
        >
          {runsUsed}/{runsQuota}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("space-y-2 rounded-md border border-border bg-surface p-3", className)}>
        <div className="flex items-baseline justify-between">
          <span className="text-tech text-muted-foreground">Usage</span>
          <span className="font-mono text-xs tabular-nums text-foreground">
            {runsUsed}/{runsQuota}
          </span>
        </div>
        {bar}
        <p className={cn("text-xs", near ? "text-warning" : "text-muted-foreground")}>
          {near ? `Only ${remaining} runs left this period` : `${remaining} remaining`}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 rounded-md border border-border bg-surface p-4", className)}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-foreground">Usage</h3>
        <span className="font-mono text-sm tabular-nums text-foreground">
          {runsUsed} / {runsQuota} runs
        </span>
      </div>
      {bar}
      <div className="flex items-center justify-between text-xs">
        <span className={near ? "text-warning" : "text-muted-foreground"}>
          {remaining} remaining
        </span>
        <span className="text-muted-foreground">
          Resets{" "}
          {new Date(usage.periodEnd).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      {near && (
        <p className="rounded-sm border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs text-warning">
          You are approaching this period&apos;s run quota.
        </p>
      )}
    </div>
  );
}
