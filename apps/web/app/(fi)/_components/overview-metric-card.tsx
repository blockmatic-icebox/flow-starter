interface OverviewMetricCardProps {
  title: string;
  value: string | null;
  definition: string;
  scopeLabel: "Last 30 days" | "Live snapshot";
  sampleNote?: string;
  footnote?: string;
}

export const OverviewMetricCard = ({
  title,
  value,
  definition,
  scopeLabel,
  sampleNote,
  footnote,
}: OverviewMetricCardProps) => (
  <div className="border-border bg-card space-y-2 rounded-md border p-4">
    <div className="flex items-start justify-between gap-2">
      <dt className="text-sm font-medium">{title}</dt>
      <span className="text-muted-foreground shrink-0 text-[10px] font-medium tracking-wide uppercase">
        {scopeLabel}
      </span>
    </div>
    <dd className="text-2xl font-semibold tabular-nums">
      {value ?? (
        <span className="text-muted-foreground text-base font-normal">
          Not enough data
        </span>
      )}
    </dd>
    <p className="text-muted-foreground text-xs leading-relaxed">
      {definition}
    </p>
    {sampleNote ? (
      <p className="text-muted-foreground text-xs">{sampleNote}</p>
    ) : null}
    {footnote ? (
      <p className="text-muted-foreground text-xs italic">{footnote}</p>
    ) : null}
  </div>
);
