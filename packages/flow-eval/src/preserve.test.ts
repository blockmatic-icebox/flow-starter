import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { verifyBaselinePreserved } from "./preserve.ts";

describe("preserve", () => {
  it("matches committed checksum index", () => {
    const result = verifyBaselinePreserved();
    assert.equal(result.ok, true, result.errors?.join("; "));
  });
});
