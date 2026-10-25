import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  initCampaign,
  runSelfImproveCampaign,
} from "./generation/self-improve.ts";
import { runScenarioSession } from "./orchestrate.ts";
import { devEvalsRoot, repoRoot } from "./paths.ts";
import { createCursorRepairExecutor } from "./product/repair-executor.ts";
import type { StressFinding } from "./product/types.ts";

const blockedAuth = () => ({
  ok: false as const,
  reason: "mocked auth blocker",
});

const finding: StressFinding = {
  confidence: "high",
  expected: "pass",
  evidence: [],
  findingId: "F-1",
  observed: "fail",
  reproduction: [],
  severity: "P1",
};

describe("eval auth blockers (test-only injection)", () => {
  it("official self-improve campaign stops blocked and writes cli-auth-blocker.json", async () => {
    const campaignId = `test-auth-block-${Date.now()}`;
    const init = initCampaign({
      campaignId,
      campaignSeed: "auth-block-test",
      iterations: 3,
      model: "composer-2.5",
    });
    assert.equal(init.ok, true);

    const result = await runSelfImproveCampaign({
      authCheck: blockedAuth,
      campaignId,
      model: "composer-2.5",
    });

    assert.equal(result.ok, false);
    assert.equal("status" in result && result.status, "blocked");
    assert.equal("blocker" in result && result.blocker, "mocked auth blocker");
    const blockerPath = path.join(devEvalsRoot, "cli-auth-blocker.json");
    assert.ok(existsSync(blockerPath));
    const payload = JSON.parse(readFileSync(blockerPath, "utf-8")) as {
      at: string;
      reason: string;
    };
    assert.equal(payload.reason, "mocked auth blocker");
    assert.ok(payload.at);
    assert.ok(
      !existsSync(
        path.join(devEvalsRoot, "self-improve", campaignId, "comparison.json")
      )
    );
  });

  it("dry-run does not invoke authCheck", async () => {
    const campaignId = `test-auth-dry-${Date.now()}`;
    const init = initCampaign({
      campaignId,
      campaignSeed: "auth-dry-test",
      iterations: 3,
      model: "composer-2.5",
    });
    assert.equal(init.ok, true);

    let authInvoked = false;
    const result = await runSelfImproveCampaign({
      authCheck: () => {
        authInvoked = true;
        return { ok: true as const };
      },
      campaignId,
      dryRun: true,
      model: "composer-2.5",
    });

    assert.equal(authInvoked, false);
    assert.equal(result.ok, true);
    assert.equal("status" in result && result.status, "dry-run");
    assert.notEqual("status" in result ? result.status : "", "completed");
  });

  it("repair executor with blocked auth does not apply", async () => {
    const executor = createCursorRepairExecutor({
      authCheck: blockedAuth,
      modelId: "composer-2.5",
    });
    const result = await executor({
      cycle: 1,
      findings: [finding],
      workDir: repoRoot,
    });
    assert.equal(result.applied, false);
    assert.match(result.summary ?? "", /mocked auth blocker/u);
  });

  it("official scenario session fails when authCheck is blocked", async () => {
    const result = await runScenarioSession({
      arm: "flow",
      authCheck: blockedAuth,
      modelId: "composer-2.5",
      official: true,
      runId: "auth-session-test",
      scenarioId: "S01",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "mocked auth blocker");
  });

  it("worktree host still uses real agent list-models check", () => {
    const hostSource = readFileSync(
      path.join(repoRoot, "scripts/worktrees/host.mjs"),
      "utf-8"
    );
    assert.match(hostSource, /--list-models/u);
    assert.doesNotMatch(hostSource, /mocked auth blocker/u);
    assert.doesNotMatch(hostSource, /AuthCheck/u);
  });
});
