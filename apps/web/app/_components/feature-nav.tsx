import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export const FeatureNav = () => (
  <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
    <div className="flex flex-col gap-1">
      <Link className="text-lg font-medium tracking-tight" href="/features">
        Feature Intelligence
      </Link>
      <p className="text-muted-foreground text-sm">
        Submit ideas, gather support, and triage with AI-assisted review.
      </p>
    </div>
    <nav className="flex flex-wrap items-center gap-2">
      <Button
        nativeButton={false}
        render={<Link href="/features" />}
        variant="ghost"
      >
        Requests
      </Button>
      <Button
        nativeButton={false}
        render={<Link href="/features/how-it-works" />}
        variant="ghost"
      >
        How prioritization works
      </Button>
      <Button nativeButton={false} render={<Link href="/features/new" />}>
        New request
      </Button>
    </nav>
  </header>
);
