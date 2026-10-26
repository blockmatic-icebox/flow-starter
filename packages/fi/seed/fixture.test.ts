import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { generateSeed } from "./generate-seed.js";
import { OPEN_QUEUE_COUNT } from "./manifest.js";
import { validateGeneratedSeed } from "./validate-manifest.js";

describe("seed fixture", () => {
  it("matches open triage queue count in manifest", () => {
    const seed = generateSeed();
    const openQueue = seed.requests.filter(
      (r) => r.status === "published" && !r.disposition
    );
    assert.equal(openQueue.length, OPEN_QUEUE_COUNT);
    assert.equal(validateGeneratedSeed(seed).ok, true);
  });
});
