"use client";

import { useAuthenticationStatus } from "@nhost/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Dashboard route group layout.
 * Redirects unauthenticated users to /login without flashing protected content.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show nothing while checking auth — prevents flash of protected content
  if (isLoading || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "2px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            animation: "spin 700ms linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
