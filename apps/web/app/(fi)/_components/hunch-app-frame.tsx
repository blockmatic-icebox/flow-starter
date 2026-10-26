"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { hunchNav } from "@/lib/hunch-content";

import {
  HunchBottomMobileNav,
  HunchDevMenu,
  HunchSidebarNav,
} from "./hunch-sidebar-nav";
import { HunchWordmark } from "./hunch-wordmark";
import { WorkspaceSheet } from "./workspace-sheet";

const pageTitleFromPath = (pathname: string) => {
  if (pathname === "/" || pathname === "/pulse") return hunchNav.overview.label;
  if (pathname.startsWith("/signals")) return hunchNav.feedback.label;
  if (pathname.startsWith("/review") || pathname.startsWith("/triage"))
    return hunchNav.triage.label;
  if (pathname.startsWith("/patterns") || pathname.startsWith("/insights"))
    return hunchNav.insights.label;
  if (pathname.startsWith("/ask") || pathname.startsWith("/chat"))
    return hunchNav.ask.label;
  if (pathname.startsWith("/feedback/new")) return "Add feedback";
  if (pathname.startsWith("/dev")) return hunchNav.dev.label;
  return null;
};

export const HunchAppFrame = ({
  children,
  openCount,
}: {
  children: ReactNode;
  openCount: number | null;
}) => {
  const pathname = usePathname();
  const isAsk = pathname.startsWith("/ask");
  const contextTitle = pageTitleFromPath(pathname);

  return (
    <div className="bg-background flex min-h-dvh">
      <aside className="border-border bg-background hidden w-52 shrink-0 flex-col border-r md:flex">
        <div className="px-4 py-5">
          <HunchWordmark />
        </div>
        <HunchSidebarNav openCount={openCount} />
        <div className="border-border border-t p-3">
          <Link
            className={`block rounded-md px-3 py-2 text-sm ${isAsk ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"}`}
            href={hunchNav.ask.href}
          >
            {hunchNav.ask.label}
          </Link>
          <p className="text-muted-foreground px-3 pt-2 text-xs">
            Demo workspace
          </p>
        </div>
      </aside>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="border-border flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="md:hidden">
              <HunchWordmark />
            </div>
            {contextTitle ? (
              <p className="text-muted-foreground hidden truncate text-sm md:block">
                {contextTitle}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <HunchDevMenu />
            <Link
              className="bg-primary text-primary-foreground inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium"
              href="/feedback/new"
            >
              Add feedback
            </Link>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <WorkspaceSheet className="p-4 md:p-6">{children}</WorkspaceSheet>
        </div>
        <HunchBottomMobileNav openCount={openCount} />
      </div>
    </div>
  );
};
