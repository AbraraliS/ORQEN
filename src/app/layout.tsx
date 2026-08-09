import "@/styles.css";
import { Inter } from "next/font/google";
import { OrgProvider } from "@/lib/auth/org-context";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Orqen — AI Workflow Orchestration",
    template: "%s · Orqen",
  },
  description:
    "Build, execute, and monitor intelligent AI workflows visually. Orqen is a full-stack workflow orchestration platform.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Orqen — AI Workflow Orchestration",
    description: "Build, execute, and monitor intelligent AI workflows visually.",
    images: [{ url: "/branding/orqen-logo.png" }],
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <OrgProvider>
            {children}
            <Toaster position="bottom-right" />
          </OrgProvider>
        </Providers>
      </body>
    </html>
  );
}
