export class DispositionError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DispositionError";
    this.code = code;
  }
}

export const validateDispositionInput = ({
  disposition,
  dispositionRationale,
  mergeTargetId,
  requestId,
}: {
  disposition: "merge" | "monitor" | "decline" | "needs_discussion";
  dispositionRationale: string;
  mergeTargetId?: string | null;
  requestId: string;
}) => {
  const rationale = dispositionRationale.trim();
  if (!rationale)
    throw new DispositionError(
      "empty_rationale",
      "Disposition rationale is required"
    );

  if (disposition === "merge") {
    if (!mergeTargetId)
      throw new DispositionError(
        "merge_target_required",
        "Merge disposition requires a target request"
      );
    if (mergeTargetId === requestId)
      throw new DispositionError(
        "merge_self",
        "Cannot merge a request into itself"
      );
  }

  return { mergeTargetId: mergeTargetId ?? null, rationale };
};

export const resolveDispositionUpdateFailure = (
  source:
    | {
        disposition: string | null;
        status: string;
      }
    | undefined
): never => {
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
  throw new DispositionError(
    "invalid_status",
    "Disposition could not be applied to this request"
  );
};
