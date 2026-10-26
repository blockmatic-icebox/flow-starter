import { inRange } from "../insights/insights-range";
import type { InsightRow } from "./compute-insights";
import { computeInsights } from "./compute-insights";

const mean = (values: number[]) =>
  values.length === 0
    ? null
    : values.reduce((sum, n) => sum + n, 0) / values.length;

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = values.toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const left = sorted[mid - 1];
    const right = sorted[mid];
    if (left === undefined || right === undefined) return null;
    return (left + right) / 2;
  }
  return sorted[mid] ?? null;
};

export const computeInsightsScoped = ({
  computedAt,
  fromIso,
  rows,
}: {
  computedAt: Date;
  fromIso: string | null;
  rows: InsightRow[];
}) => {
  const to = computedAt;
  const from = fromIso ? new Date(fromIso) : null;
  const published = rows.filter((r) => r.status === "published");

  const snapshot = computeInsights({ rows });

  if (!fromIso) return snapshot;

  const readinessRows = published.filter((r) =>
    inRange({ date: r.submittedAt, from, to })
  );
  const readinessMs = readinessRows.flatMap((r) => {
    if (!r.submittedAt || !r.triageCompletedAt) return [];
    return [r.triageCompletedAt.getTime() - r.submittedAt.getTime()];
  });

  const pmRows = published.filter((r) =>
    inRange({ date: r.dispositionAt, from, to })
  );
  const pmTriageMs = pmRows.flatMap((r) => {
    if (!r.pmReviewStartedAt || !r.dispositionAt) return [];
    return [r.dispositionAt.getTime() - r.pmReviewStartedAt.getTime()];
  });
  const pmTriageProxyMs = pmRows.flatMap((r) => {
    if (r.pmReviewStartedAt || !r.dispositionAt || !r.publishedAt) return [];
    return [r.dispositionAt.getTime() - r.publishedAt.getTime()];
  });

  const intakeDenom = published.filter((r) =>
    inRange({ date: r.publishedAt, from, to })
  );

  const intakeLinks = intakeDenom.filter((r) => r.intakeLinkedRequestId);

  return {
    ...snapshot,
    avgDecisionReadinessMs: mean(readinessMs),
    intakeLinkRate:
      intakeDenom.length === 0 ? null : intakeLinks.length / intakeDenom.length,
    medianPmTriageMs: median(pmTriageMs),
    medianPmTriageMsProxy: median(pmTriageProxyMs),
    sample: {
      ...snapshot.sample,
      intakeLinkCount: intakeLinks.length,
      pmTriageN: pmTriageMs.length,
      publishedCount: intakeDenom.length,
      readinessN: readinessMs.length,
    },
  };
};
