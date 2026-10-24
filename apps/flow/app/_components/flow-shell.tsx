"use client";

import { Button } from "@repo/ui/components/button";
import { MessageSquareIcon } from "lucide-react";
import { useState } from "react";

import { FlowAgentPanel } from "@/app/_components/flow-agent-panel";

export const FlowShell = ({ children }: { children: React.ReactNode }) => {
  const [mobileAgentOpen, setMobileAgentOpen] = useState(false);

  return (
    <div className="flex min-h-svh w-full">
      <div className="min-w-0 flex-1">{children}</div>
      {mobileAgentOpen ? (
        <button
          type="button"
          aria-label="Close Flow Agent"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileAgentOpen(false)}
        />
      ) : null}
      <aside
        aria-label="Flow Agent"
        className={[
          "flex h-svh shrink-0 flex-col border-l bg-background",
          mobileAgentOpen
            ? "fixed inset-y-0 right-0 z-50 w-full max-w-md shadow-lg"
            : "hidden",
          "md:relative md:z-auto md:flex md:w-80 md:max-w-none md:shadow-none",
        ].join(" ")}
      >
        <FlowAgentPanel />
      </aside>
      <Button
        type="button"
        className="fixed right-4 bottom-4 z-50 shadow-md md:hidden"
        size="icon"
        aria-label="Open Flow Agent"
        onClick={() => setMobileAgentOpen(true)}
      >
        <MessageSquareIcon />
      </Button>
    </div>
  );
};
