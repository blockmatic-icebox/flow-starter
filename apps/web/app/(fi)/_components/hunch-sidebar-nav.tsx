"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { hunchNav } from "@/lib/hunch-content";

const productItems = [
  hunchNav.overview,
  hunchNav.feedback,
  { ...hunchNav.triage, badge: true as const },
  hunchNav.insights,
] as const;

export const HunchSidebarNav = ({
  openCount,
}: {
  openCount: number | null;
}) => {
  const pathname = usePathname();
  const devActive = pathname.startsWith("/dev");
  const [devOpen, setDevOpen] = useState(devActive);

  const navLinkClass = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/" || pathname === "/pulse"
        : pathname === href || pathname.startsWith(`${href}/`);
    return active
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground";
  };

  const triageBadge = (() => {
    if (openCount === null)
      return { label: "—", title: "Triage queue unavailable" };
    if (openCount > 0)
      return {
        label: String(openCount),
        title: `${openCount} awaiting review`,
      };
    return null;
  })();

  return (
    <>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 px-2">
        {productItems.map((item) => (
          <Link
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${navLinkClass(item.href)}`}
            href={item.href}
            key={item.href}
          >
            {item.label}
            {"badge" in item && item.badge && triageBadge ? (
              <span
                aria-label={triageBadge.title}
                className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs tabular-nums"
              >
                {triageBadge.label}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>
      <div className="border-border space-y-1 border-t p-2">
        <button
          aria-expanded={devOpen}
          className="text-muted-foreground hover:bg-muted/60 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium tracking-wide uppercase"
          onClick={() => setDevOpen((v) => !v)}
          type="button"
        >
          Dev
          <span aria-hidden className="text-[10px]">
            {devOpen ? "▾" : "▸"}
          </span>
        </button>
        {devOpen ? (
          <Link
            className={`block rounded-md px-3 py-2 text-sm ${navLinkClass(hunchNav.dev.href)}`}
            href={hunchNav.dev.href}
          >
            {hunchNav.dev.label}
          </Link>
        ) : null}
      </div>
    </>
  );
};

export const HunchDevMenu = () => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const devActive = pathname.startsWith("/dev");

  return (
    <div className="relative md:hidden">
      <button
        aria-expanded={menuOpen}
        className="border-border rounded-md border px-2 py-1 text-xs"
        onClick={() => setMenuOpen((v) => !v)}
        type="button"
      >
        More
      </button>
      {menuOpen ? (
        <div className="border-border bg-card absolute top-full right-0 z-20 mt-1 w-44 rounded-md border p-2 shadow-sm">
          <Link
            className={`block rounded-md px-2 py-2 text-sm ${devActive ? "bg-muted" : ""}`}
            href={hunchNav.dev.href}
            onClick={() => setMenuOpen(false)}
          >
            {hunchNav.dev.label}
          </Link>
        </div>
      ) : null}
    </div>
  );
};

export const HunchBottomMobileNav = ({
  openCount,
}: {
  openCount: number | null;
}) => {
  const pathname = usePathname();

  const navLinkClass = (href: string) => {
    const active =
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname.startsWith(`${href}/`);
    return active ? "bg-muted text-foreground" : "text-muted-foreground";
  };

  const mobileItems = [...productItems, hunchNav.ask] as const;

  return (
    <nav
      aria-label="Mobile"
      className="border-border bg-background border-t p-2 md:hidden"
    >
      <ul className="grid grid-cols-5 gap-1 text-center text-[11px]">
        {mobileItems.map((item) => (
          <li key={item.href}>
            <Link
              className={`block rounded-md px-1 py-2 ${navLinkClass(item.href)}`}
              href={item.href}
            >
              {item.label === "Ask Hunch" ? "Ask" : item.label}
              {item.href === "/review" && openCount !== null && openCount > 0
                ? ` (${openCount})`
                : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
