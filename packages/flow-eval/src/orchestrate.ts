import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

import {
  agentCliVersion,
  assertAgentAuth,
  runAgentTurn,
  writeSessionMeta,
} from "./agent.ts";
import { controlResidualScan } from "./compare.ts";
import { gradeScenario } from "./grade.ts";
import { applyScenarioFixture, captureDiff, setupWorktree } from "./isolate.ts";
import { devEvalsRoot, repoRoot } from "./paths.ts";
import { redactOrThrow } from "./redact.ts";
import { writeRunSummary, writeScenarioReport } from "./report.ts";
import {
  catalogHash,
  loadHiddenScenario,
  loadPublicScenario,
} from "./scenarios.ts";
import type { EvalArm, EvalEvent, RunManifest } from "./types.ts";

const currentFlowSha = () =>
  execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf-8" }).trim();

const stakeholderMessage = ({
  scenarioId,
  turn,
}: {
  scenarioId: string;
  turn: number;
}) => {
  const card = loadPublicScenario({ id: scenarioId });
  const hidden = loadHiddenScenario({ id: scenarioId });
  if (turn === 1) {
    if (scenarioId === "S03" && hidden?.privateFacts.length) {
      const briefPath = path.join(
        devEvalsRoot,
        "catalog",
        scenarioId,
        "carebook-brief.md"
      );
      if (existsSync(briefPath))
        return `${readFileSync(briefPath, "utf-8")}\n\n${card.openingPrompt}`;
    }
    return card.openingPrompt;
  }
  const line = hidden?.approvalLines.find((l) => l.turn === turn);
  if (line) return line.message;
  const injection = hidden?.injections?.find((i) => i.afterTurn === turn - 1);
  if (injection) return injection.userMessage;
  return null;
};

export const runScenarioSession = ({
  runId,
  scenarioId,
  arm,
  modelId,
  official,
}: {
  runId: string;
  scenarioId: string;
  arm: EvalArm;
  modelId: string;
  official: boolean;
}) => {
  if (official) {
    const auth = assertAgentAuth();
    if (!auth.ok) return { ok: false, reason: auth.reason };
  }

  const flowSha = currentFlowSha();
  const { worktreePath } = setupWorktree({
    arm,
    flowSha,
    runId,
    scenarioId,
  });
  applyScenarioFixture({ scenarioId, worktreePath });

  const runDir = path.join(devEvalsRoot, runId);
  const scenarioDir = path.join(runDir, "scenarios", scenarioId);
  mkdirSync(scenarioDir, { recursive: true });

  const card = loadPublicScenario({ id: scenarioId });
  const eventsPath = path.join(scenarioDir, "transcript.jsonl");
  const rawLog = path.join(scenarioDir, "stream.raw.log");
  writeFileSync(eventsPath, "");
  writeFileSync(rawLog, "");

  let sessionId: string | undefined;
  let completeness: RunManifest["completeness"] = "partial";

  for (let turn = 1; turn <= card.turnCap; turn += 1) {
    const message = stakeholderMessage({ scenarioId, turn });
    if (!message) break;

    if (official) {
      const result = runAgentTurn({
        jsonlPath: eventsPath,
        modelId,
        prompt: message,
        rawLogPath: rawLog,
        scenarioId,
        sessionId,
        turn,
        workspace: worktreePath,
      });
      sessionId = result.sessionId;
      if (result.completeness === "complete") completeness = "complete";
    } else {
      writeFileSync(
        eventsPath,
        `${readFileSync(eventsPath, "utf-8")}${JSON.stringify({
          id: `${scenarioId}-u${turn}`,
          kind: "user",
          origin: "missing",
          scenarioId,
          text: message,
          ts: new Date().toISOString(),
          turn,
        })}\n`
      );
    }

    const hidden = loadHiddenScenario({ id: scenarioId });
    if (hidden?.stopCondition === "after-plan-approval" && turn >= 3) break;
  }

  writeSessionMeta({ runDir, scenarioId, sessionId, worktreePath });
  const diff = captureDiff({ worktreePath });
  writeFileSync(
    path.join(scenarioDir, "diff.patch"),
    redactOrThrow({ text: diff })
  );

  const hidden = loadHiddenScenario({ id: scenarioId });
  const events = existsSync(eventsPath)
    ? readFileSync(eventsPath, "utf-8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as EvalEvent)
    : [];
  const grade = gradeScenario({
    input: {
      card,
      commands: [],
      completeness,
      diff,
      events,
      hidden,
      scenarioId,
    },
  });

  writeScenarioReport({ grade, runDir, scenarioId });

  return { completeness, grade, ok: true, worktreePath };
};

export const runBatch = ({
  runId,
  scenarioIds,
  arm,
  modelId,
  official,
}: {
  runId: string;
  scenarioIds: string[];
  arm: EvalArm;
  modelId: string;
  official: boolean;
}) => {
  const grades = [];
  const errors: string[] = [];
  let lastWorktreePath: string | undefined;

  for (const scenarioId of scenarioIds) {
    const result = runScenarioSession({
      arm,
      modelId,
      official,
      runId,
      scenarioId,
    });
    if (!result.ok) {
      errors.push(result.reason ?? "unknown");
      continue;
    }
    if (result.grade) grades.push(result.grade);
    if (result.worktreePath) lastWorktreePath = result.worktreePath;
  }

  const controlResiduals =
    arm === "control" && lastWorktreePath
      ? controlResidualScan({ worktreePath: lastWorktreePath })
      : [];

  const manifest: RunManifest = {
    agentCliVersion: agentCliVersion(),
    arm,
    catalogHash: catalogHash(),
    completeness: grades.every((g) => g.confidence === "high")
      ? "complete"
      : "partial",
    controlResiduals: arm === "control" ? controlResiduals : undefined,
    cursorVersion: process.env.CURSOR_VERSION ?? "unknown",
    flowSha: currentFlowSha(),
    flowVersion: "0.1",
    harness: official ? "cursor-cli" : "diagnostic-unofficial",
    hypothesis:
      arm === "control"
        ? "Flow arm reduces authorization-set critical failures vs control."
        : undefined,
    modelId,
    runId,
  };

  const runDir = path.join(devEvalsRoot, runId);
  writeRunSummary({ grades, manifest, runDir });

  return { errors, grades, manifest };
};
