import { featureRequest, featureRequestSupport } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { count, eq } from "drizzle-orm";

export class SupportRequestError extends Error {
  readonly code: "invalid_status" | "not_found";

  constructor(code: "invalid_status" | "not_found", message: string) {
    super(message);
    this.name = "SupportRequestError";
    this.code = code;
  }
}

export const supportRequest = async ({
  db,
  requestId,
  supporterKey,
}: {
  db: AppDatabase;
  requestId: string;
  supporterKey: string;
}) => {
  const [request] = await db
    .select({ status: featureRequest.status })
    .from(featureRequest)
    .where(eq(featureRequest.id, requestId));

  if (!request)
    throw new SupportRequestError("not_found", "Feature request not found");
  if (request.status !== "published")
    throw new SupportRequestError(
      "invalid_status",
      "Support applies only to published requests"
    );

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
