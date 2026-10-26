import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DispositionError,
  resolveDispositionUpdateFailure,
} from "./disposition-errors";

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
});
