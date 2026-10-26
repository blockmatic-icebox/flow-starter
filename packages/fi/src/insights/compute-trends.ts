import type { InsightRow } from "../metrics/compute-insights";
import { buildWeeklySeries } from "./bucketing";
import { inRange } from "./insights-range";

export type TrendRow = InsightRow & {
  id: string;
  supportCount: number;
  themeKey: string | null;
  themeLabel: string | null;
  title: string;
};

export const computeTrends = ({
  fromIso,
  rows,
  to,
}: {
  fromIso: string | null;
  rows: TrendRow[];
  to: Date;
}) => {
  const published = rows.filter((r) => r.status === "published");
  const from = fromIso ? new Date(fromIso) : new Date(0);

  const weekly = buildWeeklySeries({ from, published, to });

  const inPublishedRange = published.filter((r) =>
    inRange({ date: r.publishedAt, from, to })
  );

  const themeCounts = new Map<string, { label: string; count: number }>();
  for (const r of inPublishedRange) {
    const key = r.themeKey ?? "unknown";
    const existing = themeCounts.get(key);
    if (existing) existing.count += 1;
    else
      themeCounts.set(key, {
        count: 1,
        label: r.themeLabel ?? key,
      });
  }

  const rangeMs = to.getTime() - from.getTime();
  const priorFrom = fromIso ? new Date(from.getTime() - rangeMs) : null;

  const themes = [...themeCounts.entries()]
    .map(([themeKey, { count, label }]) => {
      const priorCount =
        priorFrom === null
          ? null
          : published.filter(
              (r) =>
                r.themeKey === themeKey &&
                inRange({
                  date: r.publishedAt,
                  from: priorFrom,
                  to: from,
                })
            ).length;
      return { count, label, priorCount, themeKey };
    })
    .toSorted((a, b) => b.count - a.count)
    .slice(0, 10);

  const strategicVsPopular = published
    .filter(
      (r) =>
        r.disposition &&
        (r.disposition === "decline" || r.disposition === "monitor") &&
        r.supportCount >= 15 &&
        inRange({ date: r.dispositionAt, from, to })
    )
    .toSorted((a, b) => b.supportCount - a.supportCount)
    .slice(0, 10)
    .map((r) => ({
      disposition: r.disposition as string,
      requestId: r.id,
      supportCount: r.supportCount,
      title: r.title,
    }));

  return { strategicVsPopular, themes, weekly };
};
