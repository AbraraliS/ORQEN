"use client";

import { NhostClient, NhostProvider } from "@nhost/nextjs";
import { NhostApolloProvider } from "@nhost/react-apollo";
import type { ReactNode } from "react";

const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "local",
  region: process.env.NEXT_PUBLIC_NHOST_REGION || "",
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NhostProvider nhost={nhost} initial={undefined}>
      <NhostApolloProvider nhost={nhost}>
        {children}
      </NhostApolloProvider>
    </NhostProvider>
  );
}
