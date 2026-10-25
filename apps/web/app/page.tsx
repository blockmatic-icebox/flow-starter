export default function Page() {
  return (
    <main className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Product starter</h1>
          <p>
            Extend product contracts in PRODUCT.md and DESIGN.md as you explore
            the product, then add routes under{" "}
            <code className="font-mono text-xs">app/</code> with route-first
            colocation. Optional GenUI lives in{" "}
            <code className="font-mono text-xs">@repo/genui</code> when your
            product needs it.
          </p>
        </div>
        <p className="text-muted-foreground font-mono text-xs">
          Press <kbd>d</kbd> to toggle dark mode.
        </p>
      </div>
    </main>
  );
}
