import Link from "next/link";

export const HunchWordmark = ({ href = "/" }: { href?: string }) => (
  <Link
    className="text-foreground inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight"
    href={href}
  >
    <span className="lowercase">hunch</span>
    <span aria-hidden className="inline-flex items-center gap-0.5">
      <span className="bg-primary size-1 rounded-full" />
      <span className="bg-primary size-1.5 rounded-full" />
      <span className="bg-primary/70 size-1 rounded-full" />
    </span>
  </Link>
);
