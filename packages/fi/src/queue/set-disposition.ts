import { featureRequest, featureRequestSupport } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { eq } from "drizzle-orm";

import { FI_SIMULATED_PM_ACTOR } from "../constants";
import {
  DispositionError,
  validateDispositionInput,
} from "./disposition-errors";

export { DispositionError } from "./disposition-errors";

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
  const { mergeTargetId: targetId, rationale } = validateDispositionInput({
    disposition,
    dispositionRationale,
    mergeTargetId,
    requestId,
  });

  const [source] = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.id, requestId));

  if (!source)
    throw new DispositionError("not_found", "Feature request not found");
  if (source.status !== "published")
    throw new DispositionError(
      "invalid_status",
      "Disposition applies only to published requests"
    );
  if (source.disposition)
    throw new DispositionError(
      "already_dispositioned",
      "Request already has a disposition"
    );

  const dispositionAt = new Date();

  if (disposition !== "merge") {
    const [row] = await db
      .update(featureRequest)
      .set({
        disposition,
        dispositionAt,
        dispositionRationale: rationale,
        mergeTargetId: null,
      })
      .where(eq(featureRequest.id, requestId))
      .returning();
    return { actor: FI_SIMULATED_PM_ACTOR, request: row };
  }

  const mergeIntoId = targetId as string;

  const [target] = await db
    .select()
    .from(featureRequest)
    .where(eq(featureRequest.id, mergeIntoId));

  if (!target)
    throw new DispositionError(
      "merge_target_not_found",
      "Merge target not found"
    );
  if (target.status !== "published")
    throw new DispositionError(
      "merge_target_invalid",
      "Merge target must be a published request"
    );
  if (target.disposition === "merge" && target.mergeTargetId)
    throw new DispositionError(
      "merge_target_merged",
      "Cannot merge into a request that was merged away"
    );

  const sourceSupports = await db
    .select()
    .from(featureRequestSupport)
    .where(eq(featureRequestSupport.requestId, requestId));

  await Promise.all(
    sourceSupports.map((row) =>
      db
        .insert(featureRequestSupport)
        .values({ requestId: mergeIntoId, supporterKey: row.supporterKey })
        .onConflictDoNothing()
    )
  );

  await db
    .delete(featureRequestSupport)
    .where(eq(featureRequestSupport.requestId, requestId));

  const [archived] = await db
    .update(featureRequest)
    .set({
      canonicalRequestId: mergeIntoId,
      disposition: "merge",
      dispositionAt,
      dispositionRationale: rationale,
      mergeTargetId: mergeIntoId,
      status: "archived",
    })
    .where(eq(featureRequest.id, requestId))
    .returning();

  return {
    actor: FI_SIMULATED_PM_ACTOR,
    mergeTargetId: mergeIntoId,
    request: archived,
  };
};
