"use client";

import { useAuthenticationStatus } from "@nhost/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AuthWorkflowVisual } from "./auth-workflow-visual";
import { OrqenLogo } from "@/components/brand/orqen-logo";

export function AuthShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex h-dvh w-full bg-[#030303] text-foreground font-sans overflow-hidden">
      {/* LEFT PANEL - Hidden on mobile, 50% width on desktop */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-center overflow-hidden border-r border-white/5 bg-[#020202]">
        {/* Ambient background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_0%_0%,rgba(0,200,255,0.12),rgba(255,255,255,0))]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative z-10 flex flex-col p-10 xl:p-16 h-full justify-center items-center">
          <div className="w-full max-w-[480px]">
            <OrqenLogo variant="full" height={28} href={null} priority className="mb-10" />

            <h1 className="mb-4 text-3xl xl:text-[38px] leading-[1.15] font-semibold tracking-tight text-white/95">
              Build workflows that think, connect, and execute.
            </h1>
            <p className="text-[15px] text-muted-foreground/90">
              Orchestrate AI, APIs, logic, approvals, and data in one executable workflow.
            </p>

            <div className="mt-10 rounded-xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm shadow-2xl w-full">
              <div className="transform scale-[0.95] origin-top-left w-[105%]">
                <AuthWorkflowVisual />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Authentication, full width mobile, 50% desktop */}
      <div className="relative flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:w-1/2 lg:flex-none overflow-y-auto overflow-x-hidden z-10 bg-[#050505]">
        {/* Extremely subtle violet glow behind the auth card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30"
        >
          <div className="h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        </div>

        <div className="relative z-20 mx-auto w-full max-w-[440px]">
          {/* Mobile Logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <OrqenLogo variant="full" height={32} href={null} priority />
          </div>

          {/* Form Surface */}
          <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0A0A0A]/80 backdrop-blur-md p-8 sm:p-10 shadow-2xl relative">
            {/* Subtle inner top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
