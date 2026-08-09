"use client";

import { Loader2, AlertCircle } from "lucide-react";
import type { ReactNode, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function AuthLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[0.8125rem] font-medium text-foreground/90"
    >
      {children}
    </label>
  );
}

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefixIcon?: ReactNode;
  suffix?: ReactNode;
}

export function AuthInput({ className, prefixIcon, suffix, ...props }: AuthInputProps) {
  return (
    <div className="relative group">
      {prefixIcon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-cyan-500 transition-colors">
          {prefixIcon}
        </div>
      )}
      <input
        {...props}
        className={cn(
          "w-full h-12 rounded-lg border border-white/10 bg-white/[0.02] text-sm text-foreground outline-none transition-all duration-300",
          "focus:border-cyan-500/40 focus:bg-white/[0.04] focus:ring-[3px] focus:ring-cyan-500/10",
          "placeholder:text-muted-foreground/40",
          prefixIcon ? "pl-11" : "px-4",
          suffix ? "pr-12" : "pr-4",
          className,
        )}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {suffix}
        </div>
      )}
    </div>
  );
}

export function AuthButton({
  loading,
  disabled,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  const isDisabled = loading || disabled;
  return (
    <button
      {...props}
      disabled={isDisabled}
      className={cn(
        "relative flex w-full h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-all overflow-hidden",
        "bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600 hover:from-cyan-500 hover:via-blue-500 hover:to-violet-500",
        isDisabled
          ? "cursor-not-allowed opacity-50 grayscale-[0.5]"
          : "hover:-translate-y-[1px] shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_25px_rgba(37,99,235,0.4)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
      {loading && <Loader2 size={16} className="animate-spin relative z-10" />}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5"
    >
      <AlertCircle size={15} className="mt-[1px] shrink-0 text-destructive" />
      <p className="text-[0.8125rem] text-destructive">{message}</p>
    </div>
  );
}
