"use client";

import { Button } from "@repo/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { useIsMobile } from "@repo/ui/hooks/use-mobile";
import { MessageSquareIcon } from "lucide-react";

import { FlowAgentPanel } from "@/app/_components/flow-agent-panel";

export const FlowShell = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex min-h-svh flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <Sheet>
          <SheetTrigger
            render={
              <Button
                className="fixed right-4 bottom-4 z-40 shadow-md"
                size="icon"
                aria-label="Open Flow Agent"
              />
            }
          >
            <MessageSquareIcon />
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-md p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Flow Agent</SheetTitle>
            </SheetHeader>
            <FlowAgentPanel />
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full">
      <div className="min-w-0 flex-1">{children}</div>
      <aside
        className="hidden h-svh w-80 shrink-0 border-l md:flex md:flex-col"
        aria-label="Flow Agent"
      >
        <FlowAgentPanel />
      </aside>
    </div>
  );
};
