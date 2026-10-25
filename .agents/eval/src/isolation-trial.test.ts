import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { runnerTranscriptFileName } from "./host-protocol.ts";
import {
  assessIsolationFromTrial,
  TRUSTED_CAPTURE_METHOD,
} from "./isolation-trial.ts";
import { SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";

const scenarioDirWithRunner = ({
  events,
}: {
  events: Record<string, unknown>[];
}) => {
  const dir = mkdtempSync(path.join(tmpdir(), "iso-trial-"));
  const runnerPath = path.join(dir, runnerTranscriptFileName);
  writeFileSync(
    runnerPath,
    `${events.map((e) => JSON.stringify(e)).join("\n")}\n`
  );
  return dir;
};

describe("assessIsolationFromTrial", () => {
  it("blocks official compare when only untrusted observed events exist", () => {
    const dir = scenarioDirWithRunner({
      events: [
        {
          command: "pnpm test",
          exitCode: 0,
          id: "x",
          kind: "command",
          origin: "observed",
        },
      ],
    });
    const assessment = assessIsolationFromTrial({
      host: "cursor",
      modelId: "composer-2.5",
      protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
      scenarioDir: dir,
    });
    assert.equal(assessment.officialComparisonAllowed, false);
    assert.ok(assessment.blockers.includes("untrusted-runner-observed-events"));
    rmSync(dir, { force: true, recursive: true });
  });

  it("blocks official compare with trusted runner but no sandbox", () => {
    const dir = scenarioDirWithRunner({
      events: [
        {
          captureMethod: TRUSTED_CAPTURE_METHOD,
          command: "pnpm test",
          exitCode: 0,
          id: "x",
          kind: "command",
          origin: "observed",
        },
      ],
    });
    const assessment = assessIsolationFromTrial({
      host: "cursor",
      modelId: "composer-2.5",
      protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
      scenarioDir: dir,
    });
    assert.equal(assessment.officialComparisonAllowed, false);
    assert.equal(
      assessment.capabilities["hidden-oracle-from-subject"],
      "unsupported"
    );
    rmSync(dir, { force: true, recursive: true });
  });

  it("blocks when model identity is missing", () => {
    const dir = scenarioDirWithRunner({ events: [] });
    const assessment = assessIsolationFromTrial({
      host: "cursor",
      protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
      scenarioDir: dir,
    });
    assert.ok(assessment.blockers.includes("missing-model-identity"));
    rmSync(dir, { force: true, recursive: true });
  });

  it("never marks filesystem isolation supported on cursor worktree", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "iso-trial-"));
    mkdirSync(path.join(dir, "runner-capture"), { recursive: true });
    writeFileSync(
      path.join(dir, "runner-capture", "capture-manifest.json"),
      JSON.stringify({ sandbox: "enforced" })
    );
    const assessment = assessIsolationFromTrial({
      host: "cursor",
      modelId: "m",
      protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
      scenarioDir: dir,
    });
    assert.equal(
      assessment.capabilities["enforced-workspace-read-boundary"],
      "unsupported"
    );
    assert.equal(assessment.officialComparisonAllowed, false);
    rmSync(dir, { force: true, recursive: true });
  });
});
