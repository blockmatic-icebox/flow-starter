import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isDestructiveSeedMode, isIfEmptySeedMode } from "./seed-mode";

describe("seed mode", () => {
  it("defaults to destructive", () => {
    assert.equal(isDestructiveSeedMode({}), true);
    assert.equal(isIfEmptySeedMode({}), false);
  });

  it("if-empty when FI_SEED_IF_EMPTY=1", () => {
    assert.equal(isIfEmptySeedMode({ FI_SEED_IF_EMPTY: "1" }), true);
    assert.equal(isDestructiveSeedMode({ FI_SEED_IF_EMPTY: "1" }), false);
  });
});
