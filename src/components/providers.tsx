"use client";

import { NhostClient, NhostProvider } from "@nhost/nextjs";
import { NhostApolloProvider } from "@nhost/react-apollo";
import { useState, useEffect, type ReactNode } from "react";

// Nhost local dev configuration
const isLocal =
  typeof window === "undefined" ||
  process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN === "local" ||
  !process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN;

const nhostConfig = isLocal
  ? {
      // Route through our Next.js server-side proxy to bypass self-signed cert errors
      authUrl: "http://localhost:3000/api/nhost/auth",
      graphqlUrl: "http://localhost:3000/api/nhost/graphql",
      storageUrl: "http://localhost:3000/api/nhost/storage",
      functionsUrl: "http://localhost:3000/api/nhost/functions",
    }
  : {
      subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN!,
      region: process.env.NEXT_PUBLIC_NHOST_REGION || "",
    };

const nhost = new NhostClient(nhostConfig as any);

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a non-interactive skeleton to avoid SSR/hydration mismatch
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  return (
    <NhostProvider nhost={nhost} initial={undefined}>
      <NhostApolloProvider nhost={nhost}>{children}</NhostApolloProvider>
    </NhostProvider>
  );
}
