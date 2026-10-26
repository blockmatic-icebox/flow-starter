import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { and, desc, eq, isNull } from "drizzle-orm";

export const listTriageQueue = ({ db }: { db: AppDatabase }) =>
  db
    .select()
    .from(featureRequest)
    .where(
      and(
        eq(featureRequest.status, "published"),
        isNull(featureRequest.disposition)
      )
    )
    .orderBy(desc(featureRequest.publishedAt));
