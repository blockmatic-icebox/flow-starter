import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { scenarioTemplates } from "../../generation/catalog-data.ts";
import { evaluateReadiness, fullProductFamiliesReady } from "../readiness.ts";
import { familyFixtureRoot } from "./fixture-paths.ts";
import { acceptanceFamilies } from "./registry.ts";

describe("acceptance families", () => {
  it("has six runnable full-product templates", () => {
    const full = scenarioTemplates.filter(
      (t) =>
        t.category === "new-product" && t.complexity >= 3 && t.acceptanceFamily
    );
    assert.ok(full.length >= 6);
    assert.equal(acceptanceFamilies().length, 6);
    assert.equal(fullProductFamiliesReady(), true);
  });

  for (const family of acceptanceFamilies()) {
    it(`${family} good fixture passes contract`, () => {
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
        assert.equal(readiness.releaseVerdict, "READY");
      } finally {
        rmSync(dir, { force: true, recursive: true });
      }
    });
  }
});
