import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { agentCliVersion, writeSessionMeta } from "./agent.ts";
import { summarizeBatchOutcomes } from "./batch-outcomes.ts";
import { controlArmValid } from "./compare.ts";
import { evalConcurrency, mapWithConcurrency } from "./concurrency.ts";
import { extractCommands } from "./evidence.ts";
import type { GeneratedScenario } from "./generation/types.ts";
import { currentFlowSha } from "./git.ts";
import { prepareHostRun } from "./host-session.ts";
import {
  applyScenarioFixture,
  captureAgentDiff,
  finalizePrepBaseline,
  setupWorktree,
} from "./isolate.ts";
import { runEvalDir } from "./paths.ts";
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
import { stakeholderReply, stopAfterRecordedTurn } from "./stakeholder.ts";
import { PROTOCOL_ID } from "./trace.ts";
import { loadTranscript } from "./transcript.ts";
import { trialScenarioDir } from "./trial-paths.ts";
import type {
  EvalArm,
  EvalEvent,
  GradeResult,
  RunManifest,
  TokenUsage,
} from "./types.ts";

const runStakeholderTurns = async ({
  card,
  customTurnOnePrompt,
  eventsPath,
  hidden,
  publicBrief,
  scenarioId,
  turnLimit,
}: {
  card: ReturnType<typeof loadPublicScenario>;
  customTurnOnePrompt?: string;
  eventsPath: string;
  hidden?: ReturnType<typeof loadHiddenScenario>;
  publicBrief?: string;
  scenarioId: string;
  turnLimit: number;
}) => {
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

    if (stopAfterRecordedTurn({ hidden, turn })) return;
    await runTurn(turn + 1);
  };

  await runTurn(1);
  return {
    protocolVerified: true,
    sessionCompleteness: "complete" as const,
    sessionId: undefined,
    usage: undefined,
  };
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

const runScenarioSession = async ({
  runId,
  scenarioId,
  arm,
  official,
  worktreePath: existingWorktree,
  prepBaselineSha,
  customTurnOnePrompt,
  maxTurns,
  repetition = 1,
  generated,
}: {
  runId: string;
  scenarioId: string;
  arm: EvalArm;
  official: boolean;
  worktreePath?: string;
  prepBaselineSha?: string;
  customTurnOnePrompt?: string;
  maxTurns?: number;
  repetition?: number;
  generated?: GeneratedScenario;
}) => {
  if (official)
    return {
      ok: false as const,
      reason:
        "Official live runs use host-session: eval prepare, then /flow-eval loop (record, next, finalize).",
    };

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
    publicBrief: generated?.publicBrief,
    scenarioId,
    turnLimit,
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
  modelId?: string;
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
  modelId: modelId ?? "missing",
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
}: {
  runId: string;
  scenarioIds: string[];
  arm: EvalArm;
  modelId?: string;
  official: boolean;
  repetition?: number;
  generatedScenarios?: GeneratedScenario[];
  concurrency?: number;
}) => {
  if (official) {
    const prep = prepareHostRun({
      arm,
      generatedScenarios,
      repetition,
      runId,
      scenarioIds,
    });
    const manifestPath = path.join(runEvalDir(runId), "manifest.json");
    const manifest = JSON.parse(
      readFileSync(manifestPath, "utf-8")
    ) as RunManifest;
    if (modelId) manifest.modelId = modelId;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const worktreePaths = prep.jobs.map((j) => j.worktreePath);
    const outcomes = summarizeBatchOutcomes({
      errors: [],
      grades: [],
      infrastructureFailure: false,
      official: true,
      repetition,
      scenarioIds,
    });
    writeFileSync(
      path.join(runEvalDir(runId), "outcomes.json"),
      `${JSON.stringify(
        { ...outcomes, hostSession: true, status: "awaiting-host" },
        null,
        2
      )}\n`
    );
    return {
      errors: [],
      grades: [],
      infrastructureFailure: false,
      manifest,
      ok: false,
      outcomes,
      status: "awaiting-host" as const,
      worktreePaths,
    };
  }

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
        generated: generatedById.get(scenarioId),
        official: false,
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
    official: false,
    repetition,
    runId,
    scenarioIds,
  });

  writeFileSync(
    path.join(runEvalDir(runId), "scenario-oracle-hash.txt"),
    `${scenarioOracleHash()}\n`
  );

  const runDir = path.join(runEvalDir(runId));
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
