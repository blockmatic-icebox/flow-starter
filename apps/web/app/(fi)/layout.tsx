import type { Metadata } from "next";

import {
  fiSeoDefaultTitle,
  fiSeoProductName,
  hunchSummary,
} from "@/lib/hunch-content";

import { FiJsonLd } from "./_components/fi-json-ld";
import { FiShell } from "./_components/fi-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  description: hunchSummary,
  title: {
    default: fiSeoDefaultTitle,
    template: `%s | ${fiSeoProductName}`,
  },
};

export default function FiLayout({ children }: { children: React.ReactNode }) {
  return (
    <FiShell>
      <FiJsonLd />
      {children}
    </FiShell>
  );
}
