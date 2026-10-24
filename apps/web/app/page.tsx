import { Button } from "@repo/ui/components/button";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Flow Starter</h1>
          <p>
            AI-first monorepo baseline. Replace PRODUCT.md and DESIGN.md with
            your product; explore generative UI on the demo route.
          </p>
          <Button className="mt-2" render={<Link href="/genui-demo" />}>
            Open GenUI demo
          </Button>
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  );
}
