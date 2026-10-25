import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { repoRoot } from "../paths.ts";
import { loadAssessmentFixture, runTechnicalAiAssessmentPair } from "./run.ts";

describe("technical ai assessment fixture", () => {
  it("loads TA requirements and holdout checks", () => {
    const fixture = loadAssessmentFixture();
    assert.equal(fixture.requirements.length, 8);
    const corpus = fixture.corpus as { duplicates: unknown[] };
    assert.ok(corpus.duplicates.length > 0);
    assert.equal(fixture.holdout.harnessVersion, "1");
    assert.ok(fixture.holdout.functional.length > 0);
  });

  it("prepares an initialized session and leaves the product unverified", async (t) => {
    const runId = `prepare-${Date.now()}`;
    const armDirs = ["assessment-a", "assessment-b"].map((arm) =>
      path.join(repoRoot, "__dev", "product-evals", `${arm}-${runId}`)
    );
    t.after(() => {
      for (const armDir of armDirs)
        rmSync(armDir, { force: true, recursive: true });
    });

    const result = await runTechnicalAiAssessmentPair({
      baselineSha: "abc",
      runId,
    });

    assert.equal(result.ok, true);
    assert.equal(result.terminal, "initialized");
    assert.equal(result.developmentReady, true);
    assert.equal(result.productEvaluated, false);
    assert.equal(result.releaseVerdict, "INCONCLUSIVE");
    assert.equal(result.targetArm, "assessment-a");
    assert.equal(result.results.length, 2);

    const lifecycle = JSON.parse(
      readFileSync(path.join(armDirs[0] ?? "", "lifecycle.json"), "utf-8")
    ) as { lifecycle: string };
    const acceptance = JSON.parse(
      readFileSync(path.join(armDirs[0] ?? "", "acceptance.json"), "utf-8")
    ) as { status: string }[];
    assert.equal(lifecycle.lifecycle, "initialized");
    assert.ok(acceptance.length > 0);
    assert.ok(acceptance.every((item) => item.status === "unverified"));
  });
});
