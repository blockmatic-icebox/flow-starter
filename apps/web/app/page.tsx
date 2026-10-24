import { Button } from "@repo/ui/components/button";

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Flow</h1>
          <p>
            This repo is the monorepo starter. The /dev workspace, GitHub
            sign-in, and Eve agent are specified in PRODUCT.md and ROADMAP.md
            and are not implemented on this page yet.
          </p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  );
}
