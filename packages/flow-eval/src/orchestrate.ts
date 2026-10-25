import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

import {
  agentCliVersion,
  assertAgentAuth,
  runAgentTurn,
  runAgentTurnAsync,
  writeSessionMeta,
} from "./agent.ts";
import type { AuthCheck } from "./agent.ts";
import { summarizeBatchOutcomes } from "./batch-outcomes.ts";
import { controlArmValid } from "./compare.ts";
import { evalConcurrency, mapWithConcurrency } from "./concurrency.ts";
import { extractCommands } from "./evidence.ts";
import type { GeneratedScenario } from "./generation/types.ts";
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
import { gradeObservedScenario } from "./session-grade.ts";
import { skillsLockHash } from "./skills-lock.ts";
import { stakeholderReply } from "./stakeholder.ts";
import { foldSessionTelemetry, PROTOCOL_ID } from "./trace.ts";
import { trialScenarioDir } from "./trial-paths.ts";
import type {
  EvalArm,
  EvalEvent,
  GradeResult,
  RunManifest,
  TokenUsage,
} from "./types.ts";

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

const runStakeholderTurns = async ({
  card,
  customTurnOnePrompt,
  eventsPath,
  hidden,
  modelId,
  official,
  oracle,
  publicBrief,
  rawLog,
  scenarioId,
  turnLimit,
  useAsyncAgent,
  worktreePath,
}: {
  card: ReturnType<typeof loadPublicScenario>;
  customTurnOnePrompt?: string;
  eventsPath: string;
  hidden?: ReturnType<typeof loadHiddenScenario>;
  modelId: string;
  official: boolean;
  oracle:
    | NonNullable<ReturnType<typeof loadScenarioOracle>>
    | { scenarioId: string };
  publicBrief?: string;
  rawLog: string;
  scenarioId: string;
  turnLimit: number;
  useAsyncAgent: boolean;
  worktreePath: string;
}) => {
  let sessionId: string | undefined;
  let sessionCompleteness: RunManifest["completeness"] = "complete";
  let protocolVerified = true;
  let usage: TokenUsage | undefined;
  let eventSeq = 0;

  const runTurn = async (turn: number): Promise<void> => {
    if (turn > turnLimit) return;
    const eventsSoFar = loadTranscript({ eventsPath });
    const message =
      turn === 1 && customTurnOnePrompt
        ? customTurnOnePrompt
        : stakeholderReply({
            card,
            events: eventsSoFar,
            hidden,
            publicBrief,
            scenarioId,
            turn,
          });
    if (!message) return;

    if (official) {
      const turnInput = {
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
      };
      const result = useAsyncAgent
        ? await runAgentTurnAsync(turnInput)
        : runAgentTurn(turnInput);
      sessionId = result.sessionId;
      eventSeq += result.events.length;
      if (result.usage) usage = result.usage;
      const folded = foldSessionTelemetry({
        sessionCompleteness,
        sessionProtocolVerified: protocolVerified,
        termination: result.termination,
        turnCompleteness: result.completeness,
        turnProtocolVerified: result.protocolVerified,
      });
      sessionCompleteness = folded.completeness;
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

    if (hidden?.stopCondition === "after-plan-approval" && turn >= 3) return;
    await runTurn(turn + 1);
  };

  await runTurn(1);
  return { protocolVerified, sessionCompleteness, sessionId, usage };
};

const prepareScenarioWorktree = ({
  arm,
  existingWorktree,
  flowSha,
  generated,
  repetition,
  runId,
  scenarioId,
}: {
  arm: EvalArm;
  existingWorktree?: string;
  flowSha: string;
  generated?: GeneratedScenario;
  repetition: number;
  runId: string;
  scenarioId: string;
}) => {
  if (existingWorktree)
    return { ok: true as const, worktreePath: existingWorktree };
  try {
    const worktreePath = setupWorktree({
      arm,
      flowSha,
      repetition,
      runId,
      scenarioId,
    }).worktreePath;
    if (!generated) applyScenarioFixture({ scenarioId, worktreePath });
    return { ok: true as const, worktreePath };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "worktree setup failed";
    return { infrastructure: true, ok: false as const, reason: message };
  }
};

export const runScenarioSession = async ({
  runId,
  scenarioId,
  arm,
  modelId,
  official,
  worktreePath: existingWorktree,
  prepBaselineSha,
  customTurnOnePrompt,
  maxTurns,
  repetition = 1,
  generated,
  useAsyncAgent = true,
  authCheck = assertAgentAuth,
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
  repetition?: number;
  generated?: GeneratedScenario;
  useAsyncAgent?: boolean;
  authCheck?: AuthCheck;
}) => {
  if (official) {
    const auth = authCheck();
    if (!auth.ok) return { ok: false, reason: auth.reason };
  }

  const flowSha = currentFlowSha();
  const worktreeResult = prepareScenarioWorktree({
    arm,
    existingWorktree,
    flowSha,
    generated,
    repetition,
    runId,
    scenarioId,
  });
  if (!worktreeResult.ok) return worktreeResult;
  const worktreePath = worktreeResult.worktreePath;

  const prep = prepBaselineSha
    ? {
        commitSha: prepBaselineSha,
        fingerprint: prepBaselineSha,
        recordedAt: new Date().toISOString(),
        treeSha: prepBaselineSha,
      }
    : finalizePrepBaseline({ worktreePath });

  const scenarioDir = trialScenarioDir({
    repetition,
    runId,
    scenarioId,
  });
  mkdirSync(scenarioDir, { recursive: true });

  const card = generated?.publicCard ?? loadPublicScenario({ id: scenarioId });
  const oracle = generated?.oracle ??
    loadScenarioOracle({ id: scenarioId }) ?? { scenarioId };
  const hidden = generated?.hidden ?? loadHiddenScenario({ id: scenarioId });
  const eventsPath = path.join(scenarioDir, "transcript.jsonl");
  const rawLog = path.join(scenarioDir, "stream.raw.log");
  writeFileSync(eventsPath, "");
  writeFileSync(rawLog, "");

  const turnLimit = maxTurns ?? card.turnCap;
  const turnState = await runStakeholderTurns({
    card,
    customTurnOnePrompt,
    eventsPath,
    hidden,
    modelId,
    official,
    oracle,
    publicBrief: generated?.publicBrief,
    rawLog,
    scenarioId,
    turnLimit,
    useAsyncAgent,
    worktreePath,
  });
  const { protocolVerified, sessionId, usage } = turnState;

  writeSessionMeta({
    prepBaseline: {
      commitSha: prep.commitSha,
      fingerprint: prep.fingerprint,
    },
    scenarioDir,
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
  const grade = gradeObservedScenario({
    card,
    diff: diffCapture.patch,
    events,
    harness: official ? "cursor-cli" : "diagnostic-unofficial",
    hidden,
    official,
    oracle,
    protocolVerified,
    repetition,
    scenarioId,
    worktreePath,
  });
  const commands = extractCommands({ events });

  writeScenarioReport({
    commands,
    grade,
    scenarioDir,
  });

  const completeness = grade.completeness;

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
  grades: GradeResult[];
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
  completeness:
    grades.length === 0 ||
    grades.length < scenarioIds.length * repetition ||
    !grades.every((g) => g.officialEligible)
      ? "partial"
      : "complete",
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

export const runBatch = async ({
  runId,
  scenarioIds,
  arm,
  modelId,
  official,
  repetition = 1,
  generatedScenarios,
  concurrency,
  authCheck = assertAgentAuth,
}: {
  runId: string;
  scenarioIds: string[];
  arm: EvalArm;
  modelId: string;
  official: boolean;
  repetition?: number;
  generatedScenarios?: GeneratedScenario[];
  concurrency?: number;
  authCheck?: AuthCheck;
}) => {
  const generatedById = new Map(
    (generatedScenarios ?? []).map((s) => [s.id, s] as const)
  );
  const grades = [];
  const errors: string[] = [];
  const worktreePaths: string[] = [];
  let aggregateUsage: TokenUsage | undefined;
  let infrastructureFailure = false;

  const jobs: { rep: number; scenarioId: string }[] = [];
  for (let rep = 0; rep < repetition; rep += 1)
    for (const scenarioId of scenarioIds)
      jobs.push({ rep: rep + 1, scenarioId });

  const limit = concurrency ?? evalConcurrency();
  const results = await mapWithConcurrency({
    concurrency: limit,
    items: jobs,
    worker: ({ rep, scenarioId }) =>
      runScenarioSession({
        arm,
        authCheck,
        generated: generatedById.get(scenarioId),
        modelId,
        official,
        repetition: rep,
        runId,
        scenarioId,
      }),
  });

  for (const result of results) {
    if (!result.ok) {
      errors.push(result.reason ?? "unknown");
      if ("infrastructure" in result && result.infrastructure)
        infrastructureFailure = true;
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

  const outcomes = summarizeBatchOutcomes({
    errors,
    grades,
    infrastructureFailure,
    official,
    repetition,
    scenarioIds,
  });

  writeFileSync(
    path.join(runDir, "outcomes.json"),
    `${JSON.stringify(outcomes, null, 2)}\n`
  );

  return {
    errors,
    grades,
    infrastructureFailure,
    manifest,
    ok: outcomes.overall === "pass",
    outcomes,
    worktreePaths,
  };
};
