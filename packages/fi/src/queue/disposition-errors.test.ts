import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DispositionError,
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
