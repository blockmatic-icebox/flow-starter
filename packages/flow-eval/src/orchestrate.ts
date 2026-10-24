import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

import {
  agentCliVersion,
  assertAgentAuth,
  runAgentTurn,
  writeSessionMeta,
} from "./agent.ts";
import { controlArmValid } from "./compare.ts";
import { extractCommands } from "./evidence.ts";
import { gradeScenario } from "./grade.ts";
import {
  applyScenarioFixture,
  captureAgentDiff,
  finalizePrepBaseline,
  setupWorktree,
} from "./isolate.ts";
import { devEvalsRoot, repoRoot } from "./paths.ts";
import { redactOrThrow } from "./redact.ts";
import { writeRunSummary, writeScenarioReport } from "./report.ts";
import { rubricVersion } from "./rubric.ts";
import {
  catalogHash,
  loadHiddenScenario,
  loadPublicScenario,
  loadScenarioOracle,
  scenarioOracleHash,
} from "./scenarios.ts";
import { skillsLockHash } from "./skills-lock.ts";
import { isBuildAuthorized, stakeholderReply } from "./stakeholder.ts";
import { foldSessionTelemetry, PROTOCOL_ID } from "./trace.ts";
import type { EvalArm, EvalEvent, RunManifest, TokenUsage } from "./types.ts";

const currentFlowSha = () =>
  spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf-8",
  }).stdout.trim();

const loadTranscript = ({ eventsPath }: { eventsPath: string }) =>
  existsSync(eventsPath)
    ? readFileSync(eventsPath, "utf-8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as EvalEvent)
    : [];

export const runScenarioSession = ({
  runId,
  scenarioId,
  arm,
  modelId,
  official,
  worktreePath: existingWorktree,
  prepBaselineSha,
  customTurnOnePrompt,
  maxTurns,
}: {
  runId: string;
  scenarioId: string;
  arm: EvalArm;
  modelId: string;
  official: boolean;
  worktreePath?: string;
  prepBaselineSha?: string;
  customTurnOnePrompt?: string;
  maxTurns?: number;
}) => {
  if (official) {
    const auth = assertAgentAuth();
    if (!auth.ok) return { ok: false, reason: auth.reason };
  }

  const flowSha = currentFlowSha();
  let worktreePath = existingWorktree;
  if (!worktreePath) {
    try {
      worktreePath = setupWorktree({
        arm,
        flowSha,
        runId,
        scenarioId,
      }).worktreePath;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "worktree setup failed";
      return { infrastructure: true, ok: false, reason: message };
    }
  }

  if (!existingWorktree) applyScenarioFixture({ scenarioId, worktreePath });

  const prep = prepBaselineSha
    ? {
        commitSha: prepBaselineSha,
        fingerprint: prepBaselineSha,
        recordedAt: new Date().toISOString(),
        treeSha: prepBaselineSha,
      }
    : finalizePrepBaseline({ worktreePath });

  const runDir = path.join(devEvalsRoot, runId);
  const scenarioDir = path.join(runDir, "scenarios", scenarioId);
  mkdirSync(scenarioDir, { recursive: true });

  const card = loadPublicScenario({ id: scenarioId });
  const oracle = loadScenarioOracle({ id: scenarioId });
  const hidden = loadHiddenScenario({ id: scenarioId });
  const eventsPath = path.join(scenarioDir, "transcript.jsonl");
  const rawLog = path.join(scenarioDir, "stream.raw.log");
  writeFileSync(eventsPath, "");
  writeFileSync(rawLog, "");

  let sessionId: string | undefined;
  let completeness: RunManifest["completeness"] = "partial";
  let protocolVerified = true;
  let usage: TokenUsage | undefined;
  let eventSeq = 0;

  const turnLimit = maxTurns ?? card.turnCap;

  for (let turn = 1; turn <= turnLimit; turn += 1) {
    const eventsSoFar = loadTranscript({ eventsPath });
    const message =
      turn === 1 && customTurnOnePrompt
        ? customTurnOnePrompt
        : stakeholderReply({
            card,
            events: eventsSoFar,
            hidden,
            scenarioId,
            turn,
          });
    if (!message) break;

    if (official) {
      const result = runAgentTurn({
        jsonlPath: eventsPath,
        modelId,
        oracle,
        prompt: message,
        rawLogPath: rawLog,
        scenarioId,
        sessionId,
        startSeq: eventSeq,
        turn,
        workspace: worktreePath,
      });
      sessionId = result.sessionId;
      eventSeq += result.events.length;
      if (result.usage) usage = result.usage;
      const folded = foldSessionTelemetry({
        sessionCompleteness: completeness,
        sessionProtocolVerified: protocolVerified,
        termination: result.termination,
        turnCompleteness: result.completeness,
        turnProtocolVerified: result.protocolVerified,
      });
      completeness = folded.completeness;
      protocolVerified = folded.protocolVerified;
    } else {
      const dryEvent: EvalEvent = {
        id: `${scenarioId}-u${turn}`,
        kind: "user",
        origin: "missing",
        scenarioId,
        seq: eventSeq + 1,
        text: message,
        ts: new Date().toISOString(),
        turn,
      };
      eventSeq += 1;
      writeFileSync(
        eventsPath,
        `${readFileSync(eventsPath, "utf-8")}${JSON.stringify(dryEvent)}\n`
      );
    }

    if (hidden?.stopCondition === "after-plan-approval" && turn >= 3) break;
  }

  writeSessionMeta({
    prepBaseline: {
      commitSha: prep.commitSha,
      fingerprint: prep.fingerprint,
    },
    runDir,
    scenarioId,
    sessionId,
    worktreePath,
  });

  const diffCapture = captureAgentDiff({
    baselineSha: prep.commitSha,
    worktreePath,
  });
  writeFileSync(
    path.join(scenarioDir, "diff.patch"),
    redactOrThrow({ text: diffCapture.patch })
  );
  writeFileSync(
    path.join(scenarioDir, "git-status.txt"),
    diffCapture.statusPorcelain
  );

  const events = loadTranscript({ eventsPath });
  const commands = extractCommands({ events });
  const grade = gradeScenario({
    input: {
      assistantClaims: undefined,
      buildAuthorized: isBuildAuthorized({ events, hidden }),
      card,
      commands,
      completeness,
      diff: diffCapture.patch,
      events,
      harness: official ? "cursor-cli" : "diagnostic-unofficial",
      hidden,
      oracle,
      protocolVerified,
      scenarioId,
    },
  });

  writeScenarioReport({ commands, grade, runDir, scenarioId });

  return {
    completeness,
    grade,
    ok: true,
    prepBaselineSha: prep.commitSha,
    protocolVerified: official ? protocolVerified : true,
    usage,
    worktreePath,
  };
};

const mergeTokenUsage = ({
  aggregate,
  next,
}: {
  aggregate?: TokenUsage;
  next: TokenUsage;
}) => ({
  cacheReadTokens:
    (aggregate?.cacheReadTokens ?? 0) + (next.cacheReadTokens ?? 0),
  cacheWriteTokens:
    (aggregate?.cacheWriteTokens ?? 0) + (next.cacheWriteTokens ?? 0),
  inputTokens: (aggregate?.inputTokens ?? 0) + (next.inputTokens ?? 0),
  outputTokens: (aggregate?.outputTokens ?? 0) + (next.outputTokens ?? 0),
});

const buildBatchManifest = ({
  aggregateUsage,
  arm,
  controlCheck,
  grades,
  modelId,
  official,
  repetition,
  runId,
  scenarioIds,
}: {
  aggregateUsage?: TokenUsage;
  arm: EvalArm;
  controlCheck: ReturnType<typeof controlArmValid>;
  grades: ReturnType<typeof gradeScenario>[];
  modelId: string;
  official: boolean;
  repetition: number;
  runId: string;
  scenarioIds: string[];
}): RunManifest => ({
  acceptedControlResiduals:
    arm === "control" ? controlCheck.accepted : undefined,
  agentCliVersion: agentCliVersion(),
  arm,
  catalogHash: catalogHash(),
  completeness: grades.every((g) => g.officialEligible)
    ? "complete"
    : "partial",
  controlResiduals:
    arm === "control" && controlCheck.blocking.length
      ? controlCheck.blocking
      : undefined,
  cursorVersion: process.env.CURSOR_VERSION ?? "unknown",
  flowSha: currentFlowSha(),
  flowVersion: "0.2",
  harness: official ? "cursor-cli" : "diagnostic-unofficial",
  hypothesis:
    arm === "control"
      ? "Flow arm reduces authorization-set critical failures vs control."
      : undefined,
  modelId,
  protocol: PROTOCOL_ID,
  repetition,
  rubricVersion,
  runId,
  skillsLockHash: skillsLockHash(),
  sandboxEnabled: true,
  scenarioIds,
  sourceSha: currentFlowSha(),
  trustEnabled: true,
  usage: aggregateUsage,
});

export const runBatch = ({
  runId,
  scenarioIds,
  arm,
  modelId,
  official,
  repetition = 1,
}: {
  runId: string;
  scenarioIds: string[];
  arm: EvalArm;
  modelId: string;
  official: boolean;
  repetition?: number;
}) => {
  const grades = [];
  const errors: string[] = [];
  const worktreePaths: string[] = [];
  let aggregateUsage: TokenUsage | undefined;
  let infrastructureFailure = false;

  for (let rep = 0; rep < repetition; rep += 1) {
    for (const scenarioId of scenarioIds) {
      const result = runScenarioSession({
        arm,
        modelId,
        official,
        runId: rep === 0 ? runId : `${runId}-r${rep + 1}`,
        scenarioId,
      });
      if (!result.ok) {
        errors.push(result.reason ?? "unknown");
        if (result.infrastructure) {
          infrastructureFailure = true;
          break;
        }
        continue;
      }
      if (result.grade) grades.push(result.grade);
      if (result.worktreePath) worktreePaths.push(result.worktreePath);
      if (result.usage)
        aggregateUsage = mergeTokenUsage({
          aggregate: aggregateUsage,
          next: result.usage,
        });
    }
  }

  const controlCheck =
    arm === "control"
      ? controlArmValid({ worktreePaths })
      : { accepted: [], blocking: [], residuals: [] };

  const manifest = buildBatchManifest({
    aggregateUsage,
    arm,
    controlCheck,
    grades,
    modelId,
    official,
    repetition,
    runId,
    scenarioIds,
  });

  writeFileSync(
    path.join(devEvalsRoot, runId, "scenario-oracle-hash.txt"),
    `${scenarioOracleHash()}\n`
  );

  const runDir = path.join(devEvalsRoot, runId);
  writeRunSummary({ grades, manifest, runDir });

  return { errors, grades, infrastructureFailure, manifest };
};
