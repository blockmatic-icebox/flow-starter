import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { listRecentDecisions } from "./list-recent-decisions";

describe("listRecentDecisions", () => {
  it("exports a function", () => {
    assert.equal(typeof listRecentDecisions, "function");
  });
});
