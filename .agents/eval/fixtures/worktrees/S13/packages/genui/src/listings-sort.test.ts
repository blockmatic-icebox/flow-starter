import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sortListingsByPriceAsc } from "./listings-sort.ts";

describe("listings sort", () => {
  it("sorts prices low to high", () => {
    assert.deepEqual(sortListingsByPriceAsc([300, 100, 200]), [100, 200, 300]);
  });
});
