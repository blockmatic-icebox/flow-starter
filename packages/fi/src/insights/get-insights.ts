import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";

import { computeInsights } from "../metrics/compute-insights";

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
