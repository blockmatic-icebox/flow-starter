import { featureRequest, featureRequestSupport } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";

export type SearchRequestsSort = "support" | "published_at" | "title";

export const searchRequests = async ({
  db,
  limit,
  query,
  themeKey,
  sort = "support",
  page = 1,
  pageSize = 25,
}: {
  db: AppDatabase;
  query?: string;
  themeKey?: string;
  sort?: SearchRequestsSort;
  page?: number;
  pageSize?: number;
  /** @deprecated use pageSize */
  limit?: number;
}) => {
  const size = Math.min(Math.max(1, pageSize ?? limit ?? 25), 100);
  const pageIndex = Math.max(1, page);
  const offset = (pageIndex - 1) * size;

  const conditions = [eq(featureRequest.status, "published")];

  if (themeKey) conditions.push(eq(featureRequest.themeKey, themeKey));

  if (query?.trim()) {
    const pattern = `%${query.trim()}%`;
    const textMatch = or(
      ilike(featureRequest.title, pattern),
      ilike(featureRequest.description, pattern),
      ilike(featureRequest.problemStatement, pattern)
    );
    if (textMatch) conditions.push(textMatch);
  }

  const whereClause = and(...conditions);

  const [totalRow] = await db
    .select({ total: count() })
    .from(featureRequest)
    .where(whereClause);

  const supportCount = sql<number>`count(${featureRequestSupport.supporterKey})::int`;

  let order = desc(supportCount);
  if (sort === "title") order = asc(featureRequest.title);
  else if (sort === "published_at") order = desc(featureRequest.publishedAt);

  const rows = await db
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
    .where(whereClause)
    .groupBy(featureRequest.id)
    .orderBy(order, desc(featureRequest.publishedAt))
    .limit(size)
    .offset(offset);

  const total = Number(totalRow?.total ?? 0);

  return {
    items: rows,
    page: pageIndex,
    pageSize: size,
    total,
  };
};
