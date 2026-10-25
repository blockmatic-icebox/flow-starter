import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rubricVersion, rubricVersionHash, scoreAnchors } from "./rubric.ts";

describe("rubric reference", () => {
  it("exposes stable version metadata and anchors for graders", () => {
    assert.match(rubricVersion, /^\d{4}-\d{2}-\d{2}/u);
    assert.equal(rubricVersionHash().length, 12);
    assert.ok(scoreAnchors.verification[4]);
  });
});
