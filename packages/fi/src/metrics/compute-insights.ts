import type { TriageStepsPayload } from "../triage/types";

export interface InsightRow {
  status: string;
  disposition: string | null;
  dispositionRationale: string | null;
  intakeLinkedRequestId: string | null;
  submittedAt: Date | null;
  triageCompletedAt: Date | null;
  publishedAt: Date | null;
  pmReviewStartedAt: Date | null;
  dispositionAt: Date | null;
  triageSteps?: TriageStepsPayload | null;
}

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

const mean = (values: number[]) =>
  values.length === 0
    ? null
    : values.reduce((sum, n) => sum + n, 0) / values.length;

export const computeInsights = ({ rows }: { rows: InsightRow[] }) => {
  const published = rows.filter((r) => r.status === "published");

  const readinessMs = published.flatMap((r) => {
    if (!r.submittedAt || !r.triageCompletedAt) return [];
    return [r.triageCompletedAt.getTime() - r.submittedAt.getTime()];
  });

  const pmTriageMs = published.flatMap((r) => {
    if (!r.pmReviewStartedAt || !r.dispositionAt) return [];
    return [r.dispositionAt.getTime() - r.pmReviewStartedAt.getTime()];
  });

  const pmTriageProxyMs = published.flatMap((r) => {
    if (r.pmReviewStartedAt || !r.dispositionAt || !r.publishedAt) return [];
    return [r.dispositionAt.getTime() - r.publishedAt.getTime()];
  });

  const closed = published.filter(
    (r) => r.disposition && r.dispositionRationale?.trim()
  );
  const openQueue = published.filter((r) => !r.disposition);
  const intakeLinks = published.filter((r) => r.intakeLinkedRequestId);

  const closedCount = closed.length;
  const openQueueCount = openQueue.length;
  const captureDenom = closedCount + openQueueCount;

  return {
    avgDecisionReadinessMs: mean(readinessMs),
    computedAt: new Date().toISOString(),
    decisionCaptureRate: captureDenom === 0 ? null : closedCount / captureDenom,
    intakeLinkRate:
      published.length === 0 ? null : intakeLinks.length / published.length,
    medianPmTriageMs: median(pmTriageMs),
    medianPmTriageMsProxy: median(pmTriageProxyMs),
    openQueueCount,
    sample: {
      decisionsInRangeCount: closedCount,
      dispositionWithRationaleCount: closedCount,
      intakeLinkCount: intakeLinks.length,
      openQueueCount,
      pmTriageN: pmTriageMs.length,
      publishedCount: published.length,
      readinessDegradedN: 0,
      readinessN: readinessMs.length,
    },
  };
};
