import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { eq } from "drizzle-orm";

export const confirmRequest = async ({
  db,
  requestId,
  problemStatement,
  intakeLinkedRequestId,
}: {
  db: AppDatabase;
  requestId: string;
  problemStatement?: string;
  intakeLinkedRequestId?: string | null;
}) => {
  const publishedAt = new Date();
  const [row] = await db
    .update(featureRequest)
    .set({
      intakeLinkedRequestId: intakeLinkedRequestId ?? null,
      ...(problemStatement === undefined ? {} : { problemStatement }),
      publishedAt,
      status: "published",
    })
    .where(eq(featureRequest.id, requestId))
    .returning();

  return row;
};
