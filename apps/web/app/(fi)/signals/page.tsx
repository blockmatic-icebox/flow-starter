import { themeRegistry } from "@repo/fi";
import Link from "next/link";

import {
  formatRelativeTime,
  SignalStatusBadge,
} from "../_components/signal-status";
import { actionSearchRequests } from "../actions";

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    theme?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const themeKey =
    params.theme && params.theme in themeRegistry ? params.theme : undefined;
  const sort =
    params.sort === "published_at" ||
    params.sort === "title" ||
    params.sort === "support"
      ? params.sort
      : "support";
  const page = Math.max(1, Math.trunc(Number(params.page ?? "1")) || 1);
  const q = params.q?.trim() || undefined;

  const result = await actionSearchRequests({
    page,
    query: q,
    sort,
    themeKey,
  });

  const themes = Object.entries(themeRegistry);
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const buildHref = (nextPage: number) => {
    const sp = new URLSearchParams();
    if (themeKey) sp.set("theme", themeKey);
    if (q) sp.set("q", q);
    if (sort !== "support") sp.set("sort", sort);
    if (nextPage > 1) sp.set("page", String(nextPage));
    const qs = sp.toString();
    return qs ? `/signals?${qs}` : "/signals";
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Signals</h1>
        <p className="text-muted-foreground text-sm">
          Search and filter published feedback.
        </p>
      </header>

      <form action="/signals" className="flex flex-wrap gap-2" method="get">
        {themeKey ? (
          <input name="theme" type="hidden" value={themeKey} />
        ) : null}
        <input
          className="border-input min-w-[12rem] flex-1 rounded-md border px-3 py-2 text-sm"
          name="q"
          placeholder="Search feedback…"
          type="search"
          value={q ?? ""}
        />
        <select
          className="border-input rounded-md border px-3 py-2 text-sm"
          defaultValue={sort}
          name="sort"
        >
          <option value="support">Sort: support</option>
          <option value="published_at">Sort: recent</option>
          <option value="title">Sort: title</option>
        </select>
        <button
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          className={`rounded-md border px-3 py-1 text-sm ${themeKey ? "hover:bg-muted" : "bg-muted font-medium"}`}
          href="/signals"
        >
          All themes
        </Link>
        {themes.map(([key, meta]) => (
          <Link
            className={`rounded-md border px-3 py-1 text-sm ${themeKey === key ? "bg-muted font-medium" : "hover:bg-muted"}`}
            href={`/signals?theme=${key}`}
            key={key}
          >
            {meta.label}
          </Link>
        ))}
      </div>

      <p className="text-muted-foreground text-sm tabular-nums">
        {result.total} signals · page {result.page} of {totalPages}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="border-border text-muted-foreground border-b text-xs">
              <th className="pr-4 pb-2 font-medium">Title</th>
              <th className="pr-4 pb-2 font-medium">Theme</th>
              <th className="pr-4 pb-2 text-right font-medium">Support</th>
              <th className="pr-4 pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Received</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((row) => (
              <tr className="border-border/60 border-b" key={row.id}>
                <td className="py-2.5 pr-4">
                  <Link
                    className="text-primary font-medium hover:underline"
                    href={`/signals/${row.id}`}
                  >
                    {row.title}
                  </Link>
                </td>
                <td className="text-muted-foreground py-2.5 pr-4">
                  {row.themeLabel ?? "—"}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums">
                  {row.supportCount}
                </td>
                <td className="py-2.5 pr-4">
                  <SignalStatusBadge disposition={row.disposition} />
                </td>
                <td className="text-muted-foreground py-2.5">
                  {formatRelativeTime(row.publishedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between gap-4 text-sm">
        {page > 1 ? (
          <Link className="text-primary underline" href={buildHref(page - 1)}>
            Previous
          </Link>
        ) : (
          <span />
        )}
        {page < totalPages ? (
          <Link className="text-primary underline" href={buildHref(page + 1)}>
            Next
          </Link>
        ) : null}
      </div>
    </div>
  );
}
