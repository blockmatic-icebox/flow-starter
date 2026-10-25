import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { seedRequests } from "./fixture.js";

describe("seed fixture", () => {
  it("matches open triage queue count in specs (8)", () => {
    const openQueue = seedRequests.filter(
      (r) => r.status === "published" && r.disposition === null
    );
    assert.equal(openQueue.length, 8);
  });
});
