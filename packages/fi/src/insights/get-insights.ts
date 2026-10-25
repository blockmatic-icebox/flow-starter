import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { eq } from "drizzle-orm";

import { computeInsights } from "../metrics/compute-insights.js";

export const getInsights = async ({ db }: { db: AppDatabase }) => {
  const rows = await db.select().from(featureRequest);

  return computeInsights({
    rows: rows.map((r) => ({
      disposition: r.disposition,
      dispositionAt: r.dispositionAt,
      dispositionRationale: r.dispositionRationale,
      intakeLinkedRequestId: r.intakeLinkedRequestId,
      pmReviewStartedAt: r.pmReviewStartedAt,
      publishedAt: r.publishedAt,
      status: r.status,
      submittedAt: r.submittedAt,
      triageCompletedAt: r.triageCompletedAt,
    })),
  });
};

export const listTriageQueue = async ({ db }: { db: AppDatabase }) => {
  const rows = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.status, "published"));

  return rows
    .filter((r) => !r.disposition)
    .toSorted((a, b) => {
      const aTime = a.publishedAt?.getTime() ?? 0;
      const bTime = b.publishedAt?.getTime() ?? 0;
      return bTime - aTime;
    });
};
