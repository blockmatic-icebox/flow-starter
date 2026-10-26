import type { Metadata } from "next";

import { fiHomeSummary, fiHomeTitle } from "@/lib/fi-home-content";

import { FiShell } from "./_components/fi-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: fiHomeSummary,
  title: {
    default: fiHomeTitle,
    template: `%s | ${fiHomeTitle}`,
  },
};

export default function FiLayout({ children }: { children: React.ReactNode }) {
  return <FiShell>{children}</FiShell>;
}
