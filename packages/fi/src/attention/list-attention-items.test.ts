import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { listAttentionItems } from "./list-attention-items";

describe("listAttentionItems", () => {
  it("exports a query function", () => {
    assert.equal(typeof listAttentionItems, "function");
  });
});
