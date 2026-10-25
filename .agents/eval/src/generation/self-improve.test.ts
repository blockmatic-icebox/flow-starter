import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { experimentManifestsCompatible } from "../compare.ts";
import { buildManifest, scenarioSnapshotDir } from "./freeze.ts";
import { initCampaign } from "./self-improve.ts";

describe("self-improve campaign", () => {
  it("freezes three distinct domains", () => {
    const result = initCampaign({
      campaignId: `test-campaign-${Date.now()}`,
      campaignSeed: "campaign-unit-test",
      iterations: 3,
      maxConcurrency: 2,
      model: "composer-2.5",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const domains = new Set(result.manifest.challenges.map((c) => c.domain));
    assert.equal(domains.size, 3);
    assert.equal(result.manifest.challenges.length, 3);
    const snap = scenarioSnapshotDir({
      experimentId: `${result.manifest.campaignId}-challenge-01`,
      scenarioId: result.manifest.challenges[0]?.scenarioId ?? "",
    });
    assert.ok(snap.includes("scenarios"));
  });

  it("experiment manifests require matching scenario hashes", () => {
    const base = buildManifest({
      arm: "flow",
      experimentId: "e1",
      model: "composer-2.5",
      profile: "full-product",
      seed: "s",
      sourceSha: "sha",
      scenarioHashes: ["a"],
      scenarioIds: ["GEN-1"],
      strategy: "frozen-replay",
    });
    const other = { ...base, scenarioHashes: ["b"] };
    const compat = experimentManifestsCompatible({
      baseline: base,
      current: other,
    });
    assert.equal(compat.compatible, false);
  });
});
