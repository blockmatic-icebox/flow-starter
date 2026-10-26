import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { generateSeed } from "./generate-seed.js";
import {
  INTAKE_LINKS_COUNT,
  OPEN_QUEUE_COUNT,
  STATUS_COUNTS,
  TOTAL_REQUESTS,
} from "./manifest.js";
import { validateGeneratedSeed } from "./validate-manifest.js";

describe("seed manifest", () => {
  it("generated seed satisfies manifest", () => {
    const seed = generateSeed();
    const result = validateGeneratedSeed(seed);
    assert.equal(result.ok, true, result.errors.join("; "));
    assert.equal(seed.requests.length, TOTAL_REQUESTS);

    const published = seed.requests.filter((r) => r.status === "published");
    assert.equal(published.length, STATUS_COUNTS.published);

    const open = published.filter((r) => !r.disposition);
    assert.equal(open.length, OPEN_QUEUE_COUNT);

    const intake = published.filter((r) => r.intakeLinkedRequestId);
    assert.equal(intake.length, INTAKE_LINKS_COUNT);
  });
});
