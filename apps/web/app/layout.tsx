import { ThemeProvider } from "@repo/ui/components/theme-provider";

import "@repo/ui/globals.css";
import { cn } from "@repo/ui/lib/utils";
import type { Metadata } from "next";
import { Barlow, Geist_Mono, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
  description: "Product starter built with Flow Factory.",
  title: "Product",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const barlow = Barlow({
  subsets: ["latin"],
  variable: "--font-heading-family",
  weight: ["500", "600", "700"],
});

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
        inter.variable,
        barlow.variable
      )}
    >
      <body>
        <NuqsAdapter>
          <ThemeProvider>{children}</ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
