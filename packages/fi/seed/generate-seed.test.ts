import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { bulkIdHash, generateBulkRows, generateSeed } from "./generate-seed.js";
import { GENERATED_BULK_ID_HASH, TOTAL_REQUESTS } from "./manifest.js";

describe("generate-seed", () => {
  it("is stable for bulk ids (SD-7)", () => {
    const a = generateBulkRows()
      .map((r) => r.id)
      .join(",");
    const b = generateBulkRows()
      .map((r) => r.id)
      .join(",");
    assert.equal(a, b);
  });

  it("matches bulk id hash (SD-8)", () => {
    assert.equal(bulkIdHash(), GENERATED_BULK_ID_HASH);
  });

  it("produces total request count", () => {
    assert.equal(generateSeed().requests.length, TOTAL_REQUESTS);
  });
});
