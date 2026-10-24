import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { queryMatrixCases, queryMatrixCount } from "./query-matrix";

describe("query matrix", () => {
  it("has at least 100 domain-neutral prompts", () => {
    assert.ok(queryMatrixCount() >= 100);
    assert.equal(queryMatrixCases.length, queryMatrixCount());
  });
});
