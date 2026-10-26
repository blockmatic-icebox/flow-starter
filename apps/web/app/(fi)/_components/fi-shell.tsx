import { getDb, listTriageQueue } from "@repo/fi";
import { Badge } from "@repo/ui/components/badge";
import Link from "next/link";

export const FiShell = async ({ children }: { children: React.ReactNode }) => {
  const queue = await listTriageQueue({ db: getDb() });
  const openCount = queue.length;

  return (
    <div className="bg-background text-foreground min-h-dvh">
      <header className="border-border bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link className="font-semibold tracking-tight" href="/">
            Feature Intelligence
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/requests">Browse</Link>
            <Link href="/requests/new">Submit</Link>
            <Link className="inline-flex items-center gap-1.5" href="/triage">
              Triage
              {openCount > 0 ? (
                <Badge variant="secondary">{openCount}</Badge>
              ) : null}
            </Link>
            <Link href="/insights">Insights</Link>
            <Link className="text-muted-foreground" href="/chat">
              Ask
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
};
