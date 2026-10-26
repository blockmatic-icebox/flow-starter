import { featureRequest, featureRequestSupport } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

export type TriageQueueSort = "support" | "newest" | "oldest";

export const listTriageQueue = ({
  db,
  sort = "support",
}: {
  db: AppDatabase;
  sort?: TriageQueueSort;
}) => {
  const supportCount = sql<number>`count(${featureRequestSupport.supporterKey})::int`;

  let order = [desc(supportCount), desc(featureRequest.publishedAt)];
  if (sort === "newest") order = [desc(featureRequest.publishedAt)];
  else if (sort === "oldest") order = [asc(featureRequest.publishedAt)];

  return db
    .select({
      canonicalRequestId: featureRequest.canonicalRequestId,
      decisionBrief: featureRequest.decisionBrief,
      description: featureRequest.description,
      disposition: featureRequest.disposition,
      dispositionAt: featureRequest.dispositionAt,
      dispositionRationale: featureRequest.dispositionRationale,
      id: featureRequest.id,
      intakeLinkedRequestId: featureRequest.intakeLinkedRequestId,
      mergeTargetId: featureRequest.mergeTargetId,
      pmReviewStartedAt: featureRequest.pmReviewStartedAt,
      problemStatement: featureRequest.problemStatement,
      publishedAt: featureRequest.publishedAt,
      source: featureRequest.source,
      status: featureRequest.status,
      submittedAt: featureRequest.submittedAt,
      supportCount,
      themeKey: featureRequest.themeKey,
      themeLabel: featureRequest.themeLabel,
      themeRationale: featureRequest.themeRationale,
      title: featureRequest.title,
      triageCompletedAt: featureRequest.triageCompletedAt,
      triageConfidence: featureRequest.triageConfidence,
      triageSteps: featureRequest.triageSteps,
    })
    .from(featureRequest)
    .leftJoin(
      featureRequestSupport,
      eq(featureRequestSupport.requestId, featureRequest.id)
    )
    .where(
      and(
        eq(featureRequest.status, "published"),
        isNull(featureRequest.disposition)
      )
    )
    .groupBy(featureRequest.id)
    .orderBy(...order);
};
