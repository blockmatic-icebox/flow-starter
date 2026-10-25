import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadAssessmentFixture } from "./run.ts";

describe("technical ai assessment fixture", () => {
  it("loads TA requirements and holdout checks", () => {
    const fixture = loadAssessmentFixture();
    assert.equal(fixture.requirements.length, 8);
    assert.ok(fixture.corpus.duplicates.length > 0);
    assert.equal(fixture.holdout.harnessVersion, "1");
  });
});
