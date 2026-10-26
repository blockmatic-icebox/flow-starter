import { featureRequest, featureRequestSupport } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { sql } from "drizzle-orm";

import { computeInsightsScoped } from "../metrics/compute-insights-scoped";
import { computeTrends } from "./compute-trends";
import type { InsightsRangePreset } from "./insights-range";
import { resolveInsightsRange } from "./insights-range";

export type { InsightsRangePreset } from "./insights-range";

export const getInsights = async ({
  db,
  range,
}: {
  db: AppDatabase;
  range?: InsightsRangePreset;
}) => {
  const computedAt = new Date();
  const rows = await db.select().from(featureRequest);

  const supportRows = await db
    .select({
      count: sql<number>`count(*)::int`,
      requestId: featureRequestSupport.requestId,
    })
    .from(featureRequestSupport)
    .groupBy(featureRequestSupport.requestId);

  const supportByRequest = new Map(
    supportRows.map((s) => [s.requestId, s.count])
  );

  const insightRows = rows.map((r) => ({
    disposition: r.disposition,
    dispositionAt: r.dispositionAt,
    dispositionRationale: r.dispositionRationale,
    id: r.id,
    intakeLinkedRequestId: r.intakeLinkedRequestId,
    pmReviewStartedAt: r.pmReviewStartedAt,
    publishedAt: r.publishedAt,
    status: r.status,
    submittedAt: r.submittedAt,
    supportCount: supportByRequest.get(r.id) ?? 0,
    themeKey: r.themeKey,
    themeLabel: r.themeLabel,
    title: r.title,
    triageCompletedAt: r.triageCompletedAt,
  }));

  const rangeMeta = range
    ? resolveInsightsRange({ computedAt, preset: range })
    : null;

  const northStars = computeInsightsScoped({
    computedAt,
    fromIso: rangeMeta?.from ?? null,
    rows: insightRows,
  });

  const trends =
    range && rangeMeta
      ? computeTrends({
          fromIso: rangeMeta.from,
          rows: insightRows,
          to: computedAt,
        })
      : null;

  return {
    ...northStars,
    range: rangeMeta,
    trends,
  };
};
