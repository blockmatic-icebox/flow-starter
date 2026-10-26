import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DispositionError,
  resolveDispositionUpdateFailure,
  validateDispositionInput,
} from "./disposition-errors";

describe("validateDispositionInput", () => {
  it("rejects empty rationale", () => {
    assert.throws(
      () =>
        validateDispositionInput({
          disposition: "monitor",
          dispositionRationale: "   ",
          requestId: "a",
        }),
      (e: unknown) =>
        e instanceof DispositionError && e.code === "empty_rationale"
    );
  });

  it("requires merge target for merge", () => {
    assert.throws(
      () =>
        validateDispositionInput({
          disposition: "merge",
          dispositionRationale: "ok",
          requestId: "a",
        }),
      (e: unknown) =>
        e instanceof DispositionError && e.code === "merge_target_required"
    );
  });

  it("rejects self merge", () => {
    assert.throws(
      () =>
        validateDispositionInput({
          disposition: "merge",
          dispositionRationale: "ok",
          mergeTargetId: "same",
          requestId: "same",
        }),
      (e: unknown) => e instanceof DispositionError && e.code === "merge_self"
    );
  });
});

describe("resolveDispositionUpdateFailure", () => {
  it("throws not_found when source is missing", () => {
    assert.throws(
      () => resolveDispositionUpdateFailure(undefined),
      (e: unknown) => e instanceof DispositionError && e.code === "not_found"
    );
  });

  it("throws invalid_status for non-published requests", () => {
    assert.throws(
      () =>
        resolveDispositionUpdateFailure({
          disposition: null,
          status: "archived",
        }),
      (e: unknown) =>
        e instanceof DispositionError && e.code === "invalid_status"
    );
  });

  it("throws already_dispositioned when disposition is set", () => {
    assert.throws(
      () =>
        resolveDispositionUpdateFailure({
          disposition: "monitor",
          status: "published",
        }),
      (e: unknown) =>
        e instanceof DispositionError && e.code === "already_dispositioned"
    );
  });

  it("throws invalid_status for published rows that still cannot be updated", () => {
    assert.throws(
      () =>
        resolveDispositionUpdateFailure({
          disposition: null,
          status: "published",
        }),
      (e: unknown) =>
        e instanceof DispositionError &&
        e.code === "invalid_status" &&
        e.message === "Disposition could not be applied to this request"
    );
  });
});
