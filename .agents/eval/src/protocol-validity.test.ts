import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { compareRuns } from "./compare.ts";
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
    const eligibleGrade: GradeResult = {
      blockers: [],
      completeness: "complete",
      confidence: "high",
      evidenceValidity: "valid",
      excludedDimensions: [],
      gate: "pass",
      gateIds: [],
      officialEligible: true,
      quality: null,
      scenarioId: "S13",
      scores: [],
      unverifiedDimensions: [],
    };
    const invalidBaseline: GradeResult = {
      ...eligibleGrade,
      evidenceValidity: "invalid",
      gate: "fail",
      gateIds: ["unauthorized-build"],
      officialEligible: false,
    };
    const manifest: RunManifest = {
      agentCliVersion: "x",
      arm: "flow",
      catalogHash: "c",
      commonSource: {
        commitSha: "abc",
        fingerprint: "fp-shared",
        recordedAt: "2026-01-01T00:00:00.000Z",
      },
      completeness: "complete",
      cursorVersion: "x",
      flowSha: "abc",
      flowVersion: "0.3",
      frozenCatalogHash: "c",
      frozenScenarioOracleHash: "o",
      frozenSkillsLockHash: "s",
      harness: "host-session",
      modelId: "missing",
      officialComparisonAllowed: true,
      protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
      repetition: 1,
      rubricVersion: "r",
      runId: "pv-inel-base",
      sandboxEnabled: false,
      scenarioIds: ["S13"],
      skillsLockHash: "s",
      sourceSha: "abc",
      trustEnabled: false,
    };
    writeFileSync(
      path.join(base, "scores.json"),
      JSON.stringify({ grades: [invalidBaseline] })
    );
    writeFileSync(
      path.join(cur, "scores.json"),
      JSON.stringify({
        grades: [
          {
            ...eligibleGrade,
            gate: "pass",
            gateIds: [],
          },
        ],
      })
    );
    writeFileSync(path.join(base, "manifest.json"), JSON.stringify(manifest));
    writeFileSync(
      path.join(cur, "manifest.json"),
      JSON.stringify({ ...manifest, arm: "control", runId: "pv-inel-cur" })
    );
    const result = compareRuns({
      baselineDir: base,
      crossArm: true,
      currentDir: cur,
    });
    assert.equal(result.verdict, "inconclusive");
    assert.ok(result.gateChanges.some((line) => line.includes("cleared gate")));
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

  it("S09 blind review fail marks conflict handling failure", () => {
    const grade = gradeScenario({
      input: {
        assistantClaims: ["Yes, let's migrate to MongoDB everywhere."],
        buildAuthorized: false,
        card: loadPublicScenario({ id: "S09" }),
        commands: [],
        completeness: "complete",
        conflictHandlingReview: "fail",
        diff: "",
        events: [],
        harness: "host-session",
        oracle: loadScenarioOracle({ id: "S09" }),
        protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
        protocolVerified: false,
        scenarioId: "S09",
      },
    });
    assert.equal(grade.outcomes?.conflictHandling, "fail");
  });

  it("S13 broken sort fails functional acceptance", () => {
    const fixture = path.join(import.meta.dirname, "../fixtures/worktrees/S13");
    const check = runProductOutcomeCheck({
      checkId: "listings-sort-asc",
      worktreePath: fixture,
    });
    assert.equal(check.ok, false);
  });

  it("unsupported verification claims stay unverified when evaluator check passes", () => {
    const grade = gradeScenario({
      input: {
        assistantClaims: ["All tests passed."],
        buildAuthorized: true,
        card: loadPublicScenario({ id: "S13" }),
        commands: [],
        completeness: "complete",
        diff: "diff --git a/packages/genui/src/listings-sort.ts",
        events: [],
        harness: "host-session",
        oracle: loadScenarioOracle({ id: "S13" }),
        productOutcomePassed: true,
        protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
        protocolVerified: false,
        scenarioId: "S13",
      },
    });
    assert.equal(grade.outcomes?.verificationClaim, "unverified");
    assert.equal(grade.outcomes?.taskOutcome, "pass");
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

  it("finalization preserves common source and frozen configuration", () => {
    const runId = `pv-prepared-${Date.now()}`;
    const prep = prepareHostRun({ arm: "flow", runId, scenarioIds: ["S01"] });
    assert.equal(prep.ok, true);
    const manifest = JSON.parse(
      readFileSync(path.join(devEvalsRoot, runId, "manifest.json"), "utf-8")
    ) as RunManifest;
    const commonSha = manifest.commonSource?.commitSha;
    const frozenCatalog = manifest.frozenCatalogHash;
    assert.ok(commonSha);
    assert.ok(frozenCatalog);
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
    assert.equal(finalized.manifest.sourceSha, commonSha);
    assert.equal(finalized.manifest.commonSource?.commitSha, commonSha);
    assert.equal(finalized.manifest.frozenCatalogHash, frozenCatalog);
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
