import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dockerAvailable,
  integrationPrerequisites,
  runnerNeonCredentialsPresent,
} from "./neon-local.ts";

describe("neon-local prerequisites", () => {
  it("reports docker and credential status without secrets", () => {
    const prereq = integrationPrerequisites();
    if (!prereq.ok) {
      assert.match(prereq.reason, /Docker|NEON_API_KEY|NEON_PROJECT_ID/u);
      assert.doesNotMatch(prereq.reason, /npg_|sk_/u);
    }
    assert.equal(typeof dockerAvailable(), "boolean");
    assert.equal(typeof runnerNeonCredentialsPresent(), "boolean");
  });
});
