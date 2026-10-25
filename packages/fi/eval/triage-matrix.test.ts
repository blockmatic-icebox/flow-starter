import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runTriageMatrixOffline } from "./triage-matrix";

describe("triage-matrix offline", () => {
  it("classifies fixture themes", () => {
    const { ok, failed } = runTriageMatrixOffline();
    assert.equal(ok, true, `failed: ${JSON.stringify(failed)}`);
  });
});
