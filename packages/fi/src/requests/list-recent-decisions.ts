import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

export const listRecentDecisions = async ({
  db,
  limit = 8,
}: {
  db: AppDatabase;
  limit?: number;
}) => {
  const size = Math.min(Math.max(1, limit), 50);

  const rows = await db
    .select({
      disposition: featureRequest.disposition,
      dispositionAt: featureRequest.dispositionAt,
      dispositionRationale: featureRequest.dispositionRationale,
      id: featureRequest.id,
      themeLabel: featureRequest.themeLabel,
      title: featureRequest.title,
    })
    .from(featureRequest)
    .where(
      and(
        eq(featureRequest.status, "published"),
        isNotNull(featureRequest.disposition),
        isNotNull(featureRequest.dispositionAt),
        sql`trim(coalesce(${featureRequest.dispositionRationale}, '')) <> ''`
      )
    )
    .orderBy(desc(featureRequest.dispositionAt))
    .limit(size);

  return rows;
};
