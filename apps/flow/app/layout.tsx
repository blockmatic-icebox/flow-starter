import { ThemeProvider } from "@repo/ui/components/theme-provider";

import "@repo/ui/globals.css";
import { cn } from "@repo/ui/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { FlowShell } from "@/app/_components/flow-shell";

export const metadata: Metadata = {
  description:
    "Flow — methodology, Flow Starter architecture, and Generative UI.",
  title: "Flow",
};

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <NuqsAdapter>
          <ThemeProvider>
            <FlowShell>{children}</FlowShell>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
