import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { listTriageQueue } from "./list-triage-queue";

describe("listTriageQueue", () => {
  it("exports a query function", () => {
    assert.equal(typeof listTriageQueue, "function");
  });
});
