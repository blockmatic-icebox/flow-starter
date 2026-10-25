import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { summarizeBatchOutcomes } from "./batch-outcomes.ts";
import { scenarioTemplates } from "./generation/catalog-data.ts";
import { composeScenario } from "./generation/compose.ts";
import {
  verifyFrozenExperiment,
  freezeExperiment,
  buildManifest,
  experimentDir,
} from "./generation/freeze.ts";
import { createSeededRng } from "./generation/rng.ts";
import { selectGeneratedScenarios } from "./generation/select.ts";
import { familyFixtureRoot } from "./product/families/fixture-paths.ts";
import { runFamilyCase } from "./product/families/registry.ts";
import { evaluateReadiness } from "./product/readiness.ts";
import type { GradeResult } from "./types.ts";

const grade = (overrides: Partial<GradeResult> = {}): GradeResult => ({
  blockers: [],
  completeness: "complete",
  confidence: "high",
  excludedDimensions: [],
  gate: "pass",
  gateIds: [],
  officialEligible: true,
  quality: 90,
  scenarioId: "GEN-x",
  scores: [],
  unverifiedDimensions: [],
  ...overrides,
});

describe("adversarial evaluator integrity", () => {
  it("1 agent exits zero without grades fails overall", () => {
    const o = summarizeBatchOutcomes({
      errors: [],
      grades: [],
      infrastructureFailure: false,
      official: true,
      repetition: 1,
      scenarioIds: ["GEN-a"],
    });
    assert.equal(o.overall, "fail");
  });

  it("6 product check fails when only docs would pass gates", () => {
    const o = summarizeBatchOutcomes({
      errors: [],
      grades: [grade({ gate: "pass", productOutcomePassed: false })],
      infrastructureFailure: false,
      official: true,
      repetition: 1,
      scenarioIds: ["GEN-a"],
    });
    assert.equal(o.overall, "fail");
  });

  it("7 unrelated passing tests do not satisfy family contract", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "adv-empty-"));
    try {
      const readiness = evaluateReadiness({
        acceptanceFamily: "support-tickets",
        runId: "adv-7",
        worktreePath: dir,
      });
      assert.equal(readiness.releaseVerdict, "NOT_READY");
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it("9 bad fixture fails family contract", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "adv-bad-"));
    try {
      cpSync(
        familyFixtureRoot({ family: "support-tickets", variant: "bad" }),
        dir,
        {
          recursive: true,
        }
      );
      const row = runFamilyCase({
        caseId: "support-tickets-contract",
        evaluatedSha: "test",
        family: "support-tickets",
        runId: "adv-9",
        worktreePath: dir,
      });
      assert.equal(row.status, "failed");
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it("20 success when required test cannot execute fails readiness", () => {
    const row = runFamilyCase({
      caseId: "support-tickets-contract",
      evaluatedSha: "test",
      family: "support-tickets",
      runId: "adv-20",
      worktreePath: "/nonexistent/path",
    });
    assert.equal(row.status, "failed");
  });

  it("positive control good fixture passes", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "adv-good-"));
    try {
      cpSync(
        familyFixtureRoot({ family: "inventory-ledger", variant: "good" }),
        dir,
        {
          recursive: true,
        }
      );
      const readiness = evaluateReadiness({
        acceptanceFamily: "inventory-ledger",
        runId: "adv-pos",
        worktreePath: dir,
      });
      assert.equal(readiness.releaseVerdict, "READY");
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it("freeze refuses tampered scenario hash", () => {
    const template = scenarioTemplates.find(
      (t) => t.templateId === "NP-SUPPORT-01"
    );
    assert.ok(template);
    if (!template) return;
    const scenario = composeScenario({
      rng: createSeededRng({ seed: "freeze-adv" }),
      template,
    });
    const experimentId = `adv-freeze-${Date.now()}`;
    const manifest = buildManifest({
      arm: "flow",
      experimentId,
      model: "composer-2.5",
      profile: "full-product",
      seed: "x",
      sourceSha: "abc",
      scenarioHashes: ["deadbeef"],
      scenarioIds: [scenario.id],
      strategy: "frozen-replay",
    });
    freezeExperiment({ experimentId, manifest, scenarios: [scenario] });
    const verify = verifyFrozenExperiment({ experimentId });
    assert.equal(verify.ok, false);
    rmSync(experimentDir({ experimentId }), {
      force: true,
      recursive: true,
    });
  });

  it("2 documentation-only success leaves product acceptance unverified", () => {
    const o = summarizeBatchOutcomes({
      errors: [],
      grades: [grade({ gate: "pass", productOutcomePassed: undefined })],
      infrastructureFailure: false,
      official: true,
      repetition: 1,
      scenarioIds: ["GEN-doc"],
    });
    assert.equal(o.productAcceptance, "inconclusive");
    assert.notEqual(o.productAcceptance, "pass");
  });

  it("3 homepage-only gate pass with failed product fails overall when checked", () => {
    const o = summarizeBatchOutcomes({
      errors: [],
      grades: [
        grade({
          gate: "pass",
          gateIds: [],
          productOutcomePassed: false,
        }),
      ],
      infrastructureFailure: false,
      official: true,
      repetition: 1,
      scenarioIds: ["GEN-home"],
    });
    assert.equal(o.overall, "fail");
  });

  it("5 dead feature surfaces as failed product outcome", () => {
    const o = summarizeBatchOutcomes({
      errors: [],
      grades: [grade({ productOutcomePassed: false })],
      infrastructureFailure: false,
      official: true,
      repetition: 1,
      scenarioIds: ["GEN-dead"],
    });
    assert.equal(o.productAcceptance, "fail");
  });

  it("12 missing build authorization fails methodology on official runs", () => {
    const o = summarizeBatchOutcomes({
      errors: [],
      grades: [
        grade({ officialEligible: false, gateIds: ["unauthorized-build"] }),
      ],
      infrastructureFailure: false,
      official: true,
      repetition: 1,
      scenarioIds: ["GEN-auth"],
    });
    assert.equal(o.methodology, "fail");
    assert.equal(o.overall, "fail");
  });

  it("13 partial session grades fail session completeness", () => {
    const o = summarizeBatchOutcomes({
      errors: [],
      grades: [grade()],
      infrastructureFailure: false,
      official: true,
      repetition: 2,
      scenarioIds: ["GEN-cap"],
    });
    assert.equal(o.session, "fail");
  });

  it("17 hash change without fix still fails when product check fails", () => {
    const o = summarizeBatchOutcomes({
      errors: [],
      grades: [grade({ productOutcomePassed: false })],
      infrastructureFailure: false,
      official: true,
      repetition: 1,
      scenarioIds: ["GEN-hash"],
    });
    assert.equal(o.overall, "fail");
  });

  it("19 infrastructure error fails even with passing grades", () => {
    const o = summarizeBatchOutcomes({
      errors: ["spawn failed"],
      grades: [grade()],
      infrastructureFailure: true,
      official: true,
      repetition: 1,
      scenarioIds: ["GEN-infra"],
    });
    assert.equal(o.infrastructure, "fail");
    assert.equal(o.overall, "fail");
  });

  it("different seeds yield different scenario ids in a sample", () => {
    const ids = new Set<string>();
    for (const seed of ["a", "b", "c", "d", "e", "f"]) {
      const picked = selectGeneratedScenarios({
        count: 1,
        profile: "full-product",
        rng: createSeededRng({ seed }),
      });
      assert.equal(picked.ok, true);
      if (!picked.ok) continue;
      const scenario = picked.scenarios[0];
      assert.ok(scenario);
      ids.add(scenario.id);
    }
    assert.ok(ids.size >= 2);
  });
});
