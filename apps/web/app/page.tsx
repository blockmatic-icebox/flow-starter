import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex max-w-lg flex-col gap-3 text-center">
        <h1 className="text-2xl font-medium tracking-tight">
          Feature Intelligence
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Collect feature requests, surface support, and triage with AI-assisted
          suggestions—confirmed by humans before prioritization.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button nativeButton={false} render={<Link href="/features" />}>
            Browse requests
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/features/new" />}
            variant="secondary"
          >
            Submit a request
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground font-mono text-xs">
        Press <kbd>d</kbd> to toggle dark mode.
      </p>
    </div>
  );
}
