import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertSeedAllowed } from "./assert-seed-allowed";

describe("assertSeedAllowed", () => {
  it("allows non-production without flag", () => {
    assertSeedAllowed({ NODE_ENV: "development" });
  });

  it("blocks production without FI_SEED_ALLOW_DESTRUCTIVE", () => {
    assert.throws(
      () => assertSeedAllowed({ NODE_ENV: "production" }),
      /Refusing destructive FI seed/u
    );
  });

  it("allows production with FI_SEED_ALLOW_DESTRUCTIVE=1", () => {
    assertSeedAllowed({
      FI_SEED_ALLOW_DESTRUCTIVE: "1",
      NODE_ENV: "production",
    });
  });
});
