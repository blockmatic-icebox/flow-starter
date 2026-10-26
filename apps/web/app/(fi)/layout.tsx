import type { Metadata } from "next";

import { hunchProductName, hunchSummary } from "@/lib/hunch-content";

import { FiShell } from "./_components/fi-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: hunchSummary,
  title: {
    default: hunchProductName,
    template: `%s | ${hunchProductName}`,
  },
};

export default function FiLayout({ children }: { children: React.ReactNode }) {
  return <FiShell>{children}</FiShell>;
}
