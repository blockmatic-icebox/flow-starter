"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { HunchWordmark } from "./hunch-wordmark";
import { WorkspaceSheet } from "./workspace-sheet";

const navItems = [
  { href: "/", label: "Pulse" },
  { href: "/signals", label: "Signals" },
  { badge: true, href: "/review", label: "Review" },
  { href: "/patterns", label: "Patterns" },
] as const;

export const HunchAppFrame = ({
  children,
  openCount,
}: {
  children: ReactNode;
  openCount: number;
}) => {
  const pathname = usePathname();
  const isAsk = pathname.startsWith("/ask");

  const navLinkClass = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/" || pathname === "/pulse"
        : pathname === href || pathname.startsWith(`${href}/`);
    return active
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground";
  };

  return (
    <div className="bg-background flex min-h-dvh">
      <aside className="border-border bg-background hidden w-52 shrink-0 flex-col border-r md:flex">
        <div className="px-4 py-5">
          <HunchWordmark />
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 px-2">
          {navItems.map((item) => (
            <Link
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${navLinkClass(item.href)}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
              {"badge" in item && item.badge && openCount > 0 ? (
                <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs tabular-nums">
                  {openCount}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="border-border space-y-2 border-t p-3">
          <Link
            className={`block rounded-md px-3 py-2 text-sm ${isAsk ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"}`}
            href="/ask"
          >
            Ask Hunch
          </Link>
          <p className="text-muted-foreground px-3 text-xs">Demo workspace</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border flex items-center justify-between gap-4 border-b px-4 py-3 md:px-6">
          <div className="flex items-center gap-3 md:hidden">
            <HunchWordmark />
          </div>
          <div className="hidden flex-1 md:block" />
          <div className="flex items-center gap-2">
            <Link
              className="bg-primary text-primary-foreground inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium"
              href="/feedback/new"
            >
              Add feedback
            </Link>
            <span
              aria-hidden
              className="border-border flex size-8 items-center justify-center rounded-full border text-xs font-medium"
            >
              GE
            </span>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <WorkspaceSheet className="p-4 md:p-6">{children}</WorkspaceSheet>
        </div>
        <nav
          aria-label="Mobile"
          className="border-border bg-background border-t p-2 md:hidden"
        >
          <ul className="grid grid-cols-5 gap-1 text-center text-[11px]">
            {[...navItems, { href: "/ask", label: "Ask" }].map((item) => (
              <li key={item.href}>
                <Link
                  className={`block rounded-md px-1 py-2 ${navLinkClass(item.href)}`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};
