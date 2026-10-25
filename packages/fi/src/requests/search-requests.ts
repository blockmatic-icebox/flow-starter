import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { and, eq, ilike, or } from "drizzle-orm";

export const searchRequests = ({
  db,
  query,
  themeKey,
  limit = 20,
}: {
  db: AppDatabase;
  query?: string;
  themeKey?: string;
  limit?: number;
}) => {
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

  return db
    .select()
    .from(featureRequest)
    .where(and(...conditions))
    .limit(limit);
};
