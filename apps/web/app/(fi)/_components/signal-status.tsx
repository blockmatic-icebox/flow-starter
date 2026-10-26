import { Badge } from "@repo/ui/components/badge";

const dispositionLabel = (value: string | null | undefined) => {
  if (!value) return "Awaiting review";
  return value.replaceAll("_", " ");
};

const dispositionVariant = (value: string | null | undefined) => {
  if (!value) return "outline" as const;
  if (value === "merge") return "default" as const;
  if (value === "monitor") return "secondary" as const;
  if (value === "decline") return "destructive" as const;
  return "outline" as const;
};

const dispositionDotClass = (disposition: string | null | undefined) => {
  if (disposition === "merge") return "bg-emerald-600";
  if (disposition === "monitor") return "bg-primary";
  if (disposition === "needs_discussion") return "bg-amber-500";
  if (disposition === "decline") return "bg-destructive";
  return "bg-muted-foreground";
};

export const SignalStatusBadge = ({
  disposition,
}: {
  disposition: string | null | undefined;
}) => (
  <Badge
    className="font-normal capitalize"
    variant={dispositionVariant(disposition)}
  >
    <span
      aria-hidden
      className={`mr-1.5 inline-block size-1.5 rounded-full ${dispositionDotClass(disposition)}`}
    />
    {dispositionLabel(disposition)}
  </Badge>
);

export const formatRelativeTime = (date: Date | null | undefined) => {
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
};
