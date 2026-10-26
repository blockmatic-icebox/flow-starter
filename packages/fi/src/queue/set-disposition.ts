import { featureRequest, featureRequestSupport } from "@repo/db";
import type { AppDatabase } from "@repo/db";
import { and, eq, isNull } from "drizzle-orm";

import { FI_SIMULATED_PM_ACTOR } from "../constants";
import {
  DispositionError,
  resolveDispositionUpdateFailure,
  validateDispositionInput,
} from "./disposition-errors";

export {
  DispositionError,
  resolveDispositionUpdateFailure,
} from "./disposition-errors";

const publishedWithoutDisposition = (requestId: string) =>
  and(
    eq(featureRequest.id, requestId),
    eq(featureRequest.status, "published"),
    isNull(featureRequest.disposition)
  );

export const setDisposition = ({
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

  const dispositionAt = new Date();

  return db.transaction(async (tx) => {
    if (disposition !== "merge") {
      const [row] = await tx
        .update(featureRequest)
        .set({
          disposition,
          dispositionAt,
          dispositionRationale: rationale,
          mergeTargetId: null,
        })
        .where(publishedWithoutDisposition(requestId))
        .returning();

      if (row) return { actor: FI_SIMULATED_PM_ACTOR, request: row };

      const [source] = await tx
        .select({
          disposition: featureRequest.disposition,
          status: featureRequest.status,
        })
        .from(featureRequest)
        .where(eq(featureRequest.id, requestId));

      return resolveDispositionUpdateFailure(source);
    }

    const mergeIntoId = targetId as string;

    const [target] = await tx
      .select({
        disposition: featureRequest.disposition,
        mergeTargetId: featureRequest.mergeTargetId,
        status: featureRequest.status,
      })
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

    const sourceSupports = await tx
      .select()
      .from(featureRequestSupport)
      .where(eq(featureRequestSupport.requestId, requestId));

    await Promise.all(
      sourceSupports.map((row) =>
        tx
          .insert(featureRequestSupport)
          .values({ requestId: mergeIntoId, supporterKey: row.supporterKey })
          .onConflictDoNothing()
      )
    );

    await tx
      .delete(featureRequestSupport)
      .where(eq(featureRequestSupport.requestId, requestId));

    const [archived] = await tx
      .update(featureRequest)
      .set({
        canonicalRequestId: mergeIntoId,
        disposition: "merge",
        dispositionAt,
        dispositionRationale: rationale,
        mergeTargetId: mergeIntoId,
        status: "archived",
      })
      .where(publishedWithoutDisposition(requestId))
      .returning();

    if (archived)
      return {
        actor: FI_SIMULATED_PM_ACTOR,
        mergeTargetId: mergeIntoId,
        request: archived,
      };

    const [source] = await tx
      .select({
        disposition: featureRequest.disposition,
        status: featureRequest.status,
      })
      .from(featureRequest)
      .where(eq(featureRequest.id, requestId));

    return resolveDispositionUpdateFailure(source);
  });
};
