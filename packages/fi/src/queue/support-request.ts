import { featureRequestSupport } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { count, eq } from "drizzle-orm";

export const supportRequest = async ({
  db,
  requestId,
  supporterKey,
}: {
  db: AppDatabase;
  requestId: string;
  supporterKey: string;
}) => {
  await db
    .insert(featureRequestSupport)
    .values({ requestId, supporterKey })
    .onConflictDoNothing();

  const [supportRow] = await db
    .select({ total: count() })
    .from(featureRequestSupport)
    .where(eq(featureRequestSupport.requestId, requestId));

  return { supportCount: Number(supportRow?.total ?? 0) };
};
