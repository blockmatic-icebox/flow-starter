import type { Metadata } from "next";

import { hunchNav } from "@/lib/hunch-content";

import { AskHunchClient } from "./ask-hunch-client";

export const metadata: Metadata = {
  title: hunchNav.ask.label,
};

export default function AskHunchPage() {
  return <AskHunchClient />;
}
