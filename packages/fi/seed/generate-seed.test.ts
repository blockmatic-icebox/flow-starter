import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assembleCrewdaySeed } from "./assemble-seed.js";
import { CREWDAY_SMOKE_ANCHOR_IDS } from "./crewday-scenario.js";
import { generateSeed } from "./generate-seed.js";
import { OPEN_QUEUE_COUNT, TOTAL_REQUESTS } from "./manifest.js";
import { validateGeneratedSeed } from "./validate-manifest.js";

describe("generate-seed", () => {
  it("produces stable Crewday dataset", () => {
    const a = generateSeed();
    const b = generateSeed();
    assert.equal(a.requests.length, b.requests.length);
    assert.equal(
      a.requests.map((r) => r.id).join(","),
      b.requests.map((r) => r.id).join(",")
    );
  });

  it("produces total request count and passes validation", () => {
    const seed = generateSeed();
    assert.equal(seed.requests.length, TOTAL_REQUESTS);
    const result = validateGeneratedSeed(seed);
    assert.equal(result.ok, true, result.errors.join("; "));
  });

  it("includes documented smoke anchor ids", () => {
    const ids = new Set(generateSeed().requests.map((r) => r.id));
    for (const anchorId of Object.values(CREWDAY_SMOKE_ANCHOR_IDS)) {
      assert.ok(ids.has(anchorId), `missing smoke anchor ${anchorId}`);
    }
  });

  it("matches open queue count", () => {
    const open = generateSeed().requests.filter(
      (r) => r.status === "published" && !r.disposition
    );
    assert.equal(open.length, OPEN_QUEUE_COUNT);
  });

  it("assemble matches generateSeed", () => {
    assert.equal(
      assembleCrewdaySeed().requests.length,
      generateSeed().requests.length
    );
  });
});
