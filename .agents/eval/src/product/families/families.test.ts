import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { scenarioTemplates } from "../../generation/catalog-data.ts";
import {
  acceptanceFamiliesRegistered,
  evaluateReadiness,
} from "../readiness.ts";
import { familyFixtureRoot } from "./fixture-paths.ts";
import { acceptanceFamilies } from "./registry.ts";

describe("acceptance families", () => {
  it("registers six runnable full-product templates", () => {
    const full = scenarioTemplates.filter(
      (t) =>
        t.category === "new-product" && t.complexity >= 3 && t.acceptanceFamily
    );
    assert.ok(full.length >= 6);
    assert.equal(acceptanceFamilies().length, 6);
    assert.equal(acceptanceFamiliesRegistered(), true);
  });

  for (const family of acceptanceFamilies()) {
    it(`${family} good fixture passes contract evidence`, () => {
      const dir = mkdtempSync(path.join(os.tmpdir(), `family-${family}-`));
      try {
        cpSync(familyFixtureRoot({ family, variant: "good" }), dir, {
          recursive: true,
        });
        const readiness = evaluateReadiness({
          acceptanceFamily: family,
          runId: `family-good-${family}`,
          worktreePath: dir,
        });
        const contract = readiness.evidence.find((row) =>
          row.caseId.endsWith("-contract")
        );
        assert.equal(contract?.status, "passed");
        assert.equal(contract?.exitCode, 0);
        assert.ok(readiness.evidence.length >= 2);
        assert.equal(readiness.usability, "INCONCLUSIVE");
        assert.equal(readiness.releaseVerdict, "INCONCLUSIVE");
      } finally {
        rmSync(dir, { force: true, recursive: true });
      }
    });
  }

  it("support-tickets bad fixture fails contract and is NOT_READY", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "family-bad-support"));
    try {
      cpSync(
        familyFixtureRoot({ family: "support-tickets", variant: "bad" }),
        dir,
        { recursive: true }
      );
      const readiness = evaluateReadiness({
        acceptanceFamily: "support-tickets",
        runId: "family-bad-support-tickets",
        worktreePath: dir,
      });
      const contract = readiness.evidence.find((row) =>
        row.caseId.endsWith("-contract")
      );
      assert.equal(contract?.status, "failed");
      assert.equal(readiness.features, "FAIL");
      assert.equal(readiness.releaseVerdict, "NOT_READY");
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  });
});
