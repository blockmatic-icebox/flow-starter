import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { eq } from "drizzle-orm";

export const setDisposition = async ({
  db,
  requestId,
  disposition,
  dispositionRationale,
  mergeTargetId,
}: {
  db: AppDatabase;
  requestId: string;
  disposition: "merge" | "monitor" | "decline" | "needs_discussion";
  dispositionRationale: string;
  mergeTargetId?: string | null;
}) => {
  const dispositionAt = new Date();
  const [row] = await db
    .update(featureRequest)
    .set({
      disposition,
      dispositionAt,
      dispositionRationale,
      mergeTargetId: disposition === "merge" ? (mergeTargetId ?? null) : null,
    })
    .where(eq(featureRequest.id, requestId))
    .returning();

  return row;
};
