import { featureRequest } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { and, eq } from "drizzle-orm";

export class ConfirmRequestError extends Error {
  readonly code: "invalid_status" | "not_found";

  constructor(code: "invalid_status" | "not_found", message: string) {
    super(message);
    this.name = "ConfirmRequestError";
    this.code = code;
  }
}

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
    .where(
      and(
        eq(featureRequest.id, requestId),
        eq(featureRequest.status, "pending_confirm")
      )
    )
    .returning();

  if (row) return row;

  const [existing] = await db
    .select({ status: featureRequest.status })
    .from(featureRequest)
    .where(eq(featureRequest.id, requestId));

  if (!existing)
    throw new ConfirmRequestError("not_found", "Feature request not found");

  throw new ConfirmRequestError(
    "invalid_status",
    "Only pending_confirm requests can be confirmed"
  );
};
