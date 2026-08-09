import "@/styles.css";
import { Inter } from "next/font/google";
import { OrgProvider } from "@/lib/auth/org-context";
import { Toaster } from "@/components/ui/sonner";

import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Orqen — AI Workflow Orchestration",
  description:
    "Orqen is an AI workflow orchestration platform for building, executing, and monitoring intelligent workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
