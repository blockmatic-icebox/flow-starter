import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { compareRuns } from "./compare.ts";
import { runDeterministicGates } from "./gates.ts";
import { gradeScenario } from "./grade.ts";
import {
  hostSessionFinalize,
  hostSessionNext,
  hostSessionRecord,
  prepareHostRun,
  scenarioWorkerBrief,
} from "./host-session.ts";
import { assessIsolation, SUBJECT_EVALUATOR_PROTOCOL_ID } from "./isolation.ts";
import { devEvalsRoot } from "./paths.ts";
import { runProductOutcomeCheck } from "./product-outcome.ts";
import { runFamilyModuleCheck } from "./product/families/module-check.ts";
import { evaluateReadiness } from "./product/readiness.ts";
import { validateSubjectRecordEvents } from "./record-validation.ts";
import { loadPublicScenario, loadScenarioOracle } from "./scenarios.ts";
import { subjectPromptHasNoEvalLeak } from "./subject-prompt.ts";
import type { EvalEvent, GradeResult, RunManifest } from "./types.ts";

const normalizeSubjectPrompt = (text: string) =>
  text.replace(/Workspace: .+/u, "Workspace: <neutral>");

describe("protocol validity (mocked; not live Cursor isolation proof)", () => {
  it("flow and control subject prompts are identical without eval context", () => {
    const runId = `pv-prompts-${Date.now()}`;
    prepareHostRun({ arm: "flow", runId, scenarioIds: ["S13"] });
    const flowBrief = scenarioWorkerBrief({
      repetition: 1,
      runId,
      scenarioId: "S13",
    });
    const controlRun = `${runId}-control`;
    prepareHostRun({ arm: "control", runId: controlRun, scenarioIds: ["S13"] });
    const controlBrief = scenarioWorkerBrief({
      repetition: 1,
      runId: controlRun,
      scenarioId: "S13",
    });
    assert.equal(flowBrief.ok && controlBrief.ok, true);
    if (!flowBrief.ok || !controlBrief.ok) return;
    assert.equal(
      normalizeSubjectPrompt(flowBrief.prompt),
      normalizeSubjectPrompt(controlBrief.prompt)
    );
    assert.equal(
      subjectPromptHasNoEvalLeak({ prompt: flowBrief.prompt }),
      true
    );
  });

  it("subject record cannot submit observed evidence", () => {
    const result = validateSubjectRecordEvents({
      events: [
        {
          id: "1",
          kind: "assistant",
          origin: "observed",
          scenarioId: "S13",
          seq: 1,
          text: "hi",
          ts: new Date().toISOString(),
          turn: 1,
        },
      ],
      repetition: 1,
      runId: "r",
      scenarioId: "S13",
      turn: 1,
    });
    assert.equal(result.ok, false);
  });

  it("missing origin fails validation", () => {
    const result = validateSubjectRecordEvents({
      events: [
        {
          id: "1",
          kind: "assistant",
          scenarioId: "S13",
          seq: 1,
          text: "hi",
          ts: new Date().toISOString(),
          turn: 1,
        } as EvalEvent,
      ],
      repetition: 1,
      runId: "r",
      scenarioId: "S13",
      turn: 1,
    });
    assert.equal(result.ok, false);
  });

  it("missing manifests cannot yield official improvement", () => {
    const base = path.join(devEvalsRoot, "pv-no-manifest-base");
    const cur = path.join(devEvalsRoot, "pv-no-manifest-cur");
    mkdirSync(base, { recursive: true });
    mkdirSync(cur, { recursive: true });
    writeFileSync(
      path.join(base, "scores.json"),
      JSON.stringify({ grades: [] })
    );
    writeFileSync(
      path.join(cur, "scores.json"),
      JSON.stringify({ grades: [] })
    );
    const result = compareRuns({ baselineDir: base, currentDir: cur });
    assert.equal(result.verdict, "inconclusive");
  });

  it("ineligible grades cannot support improvement claims", () => {
    const base = path.join(devEvalsRoot, "pv-inel-base");
    const cur = path.join(devEvalsRoot, "pv-inel-cur");
    mkdirSync(base, { recursive: true });
    mkdirSync(cur, { recursive: true });
    const grade: GradeResult = {
      blockers: ["unsupported-isolation"],
      completeness: "complete",
      confidence: "low",
      excludedDimensions: [],
      gate: "pass",
      gateIds: [],
      officialEligible: false,
      quality: null,
      scenarioId: "S13",
      scores: [],
      unverifiedDimensions: [],
    };
    const manifest: RunManifest = {
      agentCliVersion: "x",
      arm: "flow",
      catalogHash: "c",
      completeness: "partial",
      cursorVersion: "x",
      flowSha: "abc",
      flowVersion: "0.3",
      harness: "host-session",
      modelId: "missing",
      officialComparisonAllowed: false,
      protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
      repetition: 1,
      rubricVersion: "r",
      runId: "pv-inel-cur",
      sandboxEnabled: false,
      scenarioIds: ["S13"],
      sourceSha: "abc",
      trustEnabled: false,
    };
    writeFileSync(
      path.join(base, "scores.json"),
      JSON.stringify({ grades: [grade] })
    );
    writeFileSync(
      path.join(cur, "scores.json"),
      JSON.stringify({ grades: [grade] })
    );
    writeFileSync(path.join(base, "manifest.json"), JSON.stringify(manifest));
    writeFileSync(
      path.join(cur, "manifest.json"),
      JSON.stringify({ ...manifest, arm: "control" })
    );
    const result = compareRuns({
      baselineDir: base,
      crossArm: true,
      currentDir: cur,
    });
    assert.equal(result.verdict, "inconclusive");
  });

  it("v2 grades do not emit quality percentage", () => {
    const card = loadPublicScenario({ id: "S13" });
    const grade = gradeScenario({
      input: {
        buildAuthorized: true,
        card,
        commands: [],
        completeness: "complete",
        diff: "",
        events: [],
        harness: "host-session",
        oracle: loadScenarioOracle({ id: "S13" }),
        productOutcomePassed: true,
        protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
        protocolVerified: false,
        scenarioId: "S13",
      },
    });
    assert.equal(grade.quality, null);
    assert.ok(grade.outcomes);
  });

  it("S09 agreement without action fails conflict handling", () => {
    const card = loadPublicScenario({ id: "S09" });
    const { gateIds } = runDeterministicGates({
      input: {
        assistantClaims: ["Yes, let's migrate to MongoDB everywhere."],
        buildAuthorized: false,
        card,
        commands: [],
        completeness: "complete",
        diff: "",
        events: [],
        harness: "host-session",
        oracle: loadScenarioOracle({ id: "S09" }),
        protocolVerified: false,
        scenarioId: "S09",
      },
    });
    assert.ok(gateIds.includes("conflict-handling-failure"));
  });

  it("S13 broken sort fails functional acceptance", () => {
    const fixture = path.join(import.meta.dirname, "../fixtures/worktrees/S13");
    const check = runProductOutcomeCheck({
      checkId: "listings-sort-asc",
      worktreePath: fixture,
    });
    assert.equal(check.ok, false);
  });

  it("unsupported verification claims fail when evaluator check passes", () => {
    const card = loadPublicScenario({ id: "S13" });
    const { gateIds } = runDeterministicGates({
      input: {
        assistantClaims: ["All tests passed."],
        buildAuthorized: true,
        card,
        commands: [],
        completeness: "complete",
        diff: "diff --git a/packages/genui/src/listings-sort.ts",
        events: [],
        harness: "host-session",
        oracle: loadScenarioOracle({ id: "S13" }),
        productOutcomePassed: true,
        protocolVerified: false,
        scenarioId: "S13",
      },
    });
    assert.ok(
      gateIds.includes("fabricated-verification") ||
        gateIds.includes("verification-claim-failure")
    );
  });

  it("inconclusive usability prevents application READY on family path", () => {
    const readiness = evaluateReadiness({
      acceptanceFamily: "support-tickets",
      runId: "pv-ready",
      worktreePath: path.join(
        import.meta.dirname,
        "../fixtures/products/support-tickets/good"
      ),
    });
    assert.notEqual(readiness.releaseVerdict, "READY");
    assert.equal(readiness.usability, "INCONCLUSIVE");
  });

  it("contract presence alone cannot establish engineering PASS", () => {
    const row = runFamilyModuleCheck({
      caseId: "support-tickets-engineering",
      engineeringOnly: true,
      evaluatedSha: "x",
      expectedRelativePath: "packages/flow-eval-contract/support-tickets.mjs",
      family: "support-tickets",
      runId: "pv",
      worktreePath: path.join(
        import.meta.dirname,
        "../fixtures/products/support-tickets/good"
      ),
    });
    assert.equal(row.status, "unverified");
  });

  it("finalization preserves prepared source revision", () => {
    const runId = `pv-prepared-${Date.now()}`;
    const prep = prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    assert.equal(prep.ok, true);
    const manifest = JSON.parse(
      readFileSync(path.join(devEvalsRoot, runId, "manifest.json"), "utf-8")
    ) as RunManifest;
    const preparedSha = manifest.preparedSource?.commitSha;
    assert.ok(preparedSha);
    const turn = hostSessionNext({ runId, scenarioId: "S01" });
    if (!turn.ok || turn.status !== "turn") return;
    hostSessionRecord({
      events: [
        {
          id: "a",
          kind: "assistant",
          origin: "agent-reported",
          scenarioId: "S01",
          seq: 2,
          text: "Exploring scope.",
          ts: new Date().toISOString(),
          turn: turn.packet.turn,
        },
      ],
      repetition: 1,
      runId,
      scenarioId: "S01",
      turn: turn.packet.turn,
    });
    while (true) {
      const n = hostSessionNext({ runId, scenarioId: "S01" });
      if (!n.ok || n.status !== "turn") break;
      hostSessionRecord({
        events: [
          {
            id: `a-${n.packet.turn}`,
            kind: "assistant",
            origin: "agent-reported",
            scenarioId: "S01",
            seq: n.packet.turn * 2,
            text: "Still exploring.",
            ts: new Date().toISOString(),
            turn: n.packet.turn,
          },
        ],
        repetition: 1,
        runId,
        scenarioId: "S01",
        turn: n.packet.turn,
      });
    }
    const finalized = hostSessionFinalize({ runId });
    assert.equal(finalized.ok, true);
    if (!finalized.ok) return;
    assert.equal(finalized.manifest.sourceSha, preparedSha);
    assert.equal(finalized.manifest.preparedSource?.commitSha, preparedSha);
  });

  it("production isolation assessment blocks official comparisons", () => {
    const assessment = assessIsolation({
      host: "cursor",
      protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
    });
    assert.equal(assessment.officialComparisonAllowed, false);
    assert.ok(assessment.blockers.length > 0);
  });

  it("interrupted sessions stay incomplete", () => {
    const runId = `pv-interrupt-${Date.now()}`;
    prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    hostSessionNext({ runId, scenarioId: "S01" });
    const finalized = hostSessionFinalize({ runId });
    assert.equal(finalized.ok, false);
  });
});
