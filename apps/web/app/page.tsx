export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Product starter</h1>
          <p>
            Replace PRODUCT.md and DESIGN.md, then add routes under{" "}
            <code className="font-mono text-xs">app/</code> with route-first
            colocation. Generative UI and Flow Agent live in the separate Flow
            application (
            <code className="font-mono text-xs">pnpm dev:flow</code>
            ).
          </p>
        </div>
        <p className="text-muted-foreground font-mono text-xs">
          Press <kbd>d</kbd> to toggle dark mode.
        </p>
      </div>
    </div>
  );
}
