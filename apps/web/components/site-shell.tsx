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

import { ConsultantChatPanel } from "@/features/consultant-chat/consultant-chat-panel";

export const SiteShell = ({ children }: { children: React.ReactNode }) => {
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
                aria-label="Open consultant chat"
              />
            }
          >
            <MessageSquareIcon />
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-md p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Consultant</SheetTitle>
            </SheetHeader>
            <ConsultantChatPanel />
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
        aria-label="Consultant chat"
      >
        <ConsultantChatPanel />
      </aside>
    </div>
  );
};
