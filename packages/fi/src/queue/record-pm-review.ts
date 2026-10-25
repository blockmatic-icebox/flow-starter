import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { and, eq, isNull } from "drizzle-orm";

export const recordPmReviewStarted = async ({
  db,
  requestId,
}: {
  db: AppDatabase;
  requestId: string;
}) => {
  const now = new Date();
  const [row] = await db
    .update(featureRequest)
    .set({ pmReviewStartedAt: now })
    .where(
      and(
        eq(featureRequest.id, requestId),
        isNull(featureRequest.pmReviewStartedAt)
      )
    )
    .returning();

  if (row) return row;

  const [existing] = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.id, requestId));

  return existing ?? null;
};
