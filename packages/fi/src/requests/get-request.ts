import {
  featureRequest,
  featureRequestDuplicateCandidate,
  featureRequestSupport,
} from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { count, eq } from "drizzle-orm";

export const getRequest = async ({
  db,
  requestId,
}: {
  db: AppDatabase;
  requestId: string;
}) => {
  const [row] = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.id, requestId));

  if (!row) return null;

  const duplicates = await db
    .select({
      candidateRequestId: featureRequestDuplicateCandidate.candidateRequestId,
      explanation: featureRequestDuplicateCandidate.explanation,
      id: featureRequestDuplicateCandidate.id,
      score: featureRequestDuplicateCandidate.score,
      title: featureRequest.title,
    })
    .from(featureRequestDuplicateCandidate)
    .innerJoin(
      featureRequest,
      eq(featureRequestDuplicateCandidate.candidateRequestId, featureRequest.id)
    )
    .where(eq(featureRequestDuplicateCandidate.requestId, requestId));

  const [supportRow] = await db
    .select({ total: count() })
    .from(featureRequestSupport)
    .where(eq(featureRequestSupport.requestId, requestId));

  return {
    duplicates,
    request: row,
    supportCount: Number(supportRow?.total ?? 0),
  };
};
