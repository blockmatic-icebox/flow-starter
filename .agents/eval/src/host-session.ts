import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { agentCliVersion, writeSessionMeta } from "./agent.ts";
import { controlArmValid } from "./compare.ts";
import { extractCommands } from "./evidence.ts";
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
import { HOST_SESSION_PROTOCOL_ID } from "./trace.ts";
import { trialScenarioDir } from "./trial-paths.ts";
import type {
  EvalArm,
  EvalEvent,
  EvalHost,
  GradeResult,
  RunManifest,
} from "./types.ts";

export const detectEvalHost = (): EvalHost => {
  if (process.env.CLAUDE_CODE === "1" || process.env.CLAUDECODE === "1")
    return "claude";
  if (process.env.CURSOR_TRACE_ID || process.env.CURSOR_SESSION_ID)
    return "cursor";
  return "other";
};

type HostJob = {
  scenarioId: string;
  repetition: number;
  turnLimit: number;
  currentTurn: number;
  status: "pending" | "awaiting-record" | "complete";
  worktreePath: string;
  prepBaselineSha: string;
};

type HostSessionState = {
  arm: EvalArm;
  host: EvalHost;
  jobs: HostJob[];
  modelId?: string;
  repetition: number;
  runId: string;
  scenarioIds: string[];
};

const statePath = ({ runId }: { runId: string }) =>
  path.join(devEvalsRoot, runId, "host-session-state.json");

const loadState = ({ runId }: { runId: string }) => {
  const file = statePath({ runId });
  if (!existsSync(file)) return null;
  const state = JSON.parse(readFileSync(file, "utf-8")) as HostSessionState;
  state.jobs = state.jobs.map((job) => {
    const overlay = jobFile({
      repetition: job.repetition,
      runId,
      scenarioId: job.scenarioId,
    });
    if (!existsSync(overlay)) return job;
    return JSON.parse(readFileSync(overlay, "utf-8")) as HostJob;
  });
  return state;
};

const jobFile = ({
  repetition,
  runId,
  scenarioId,
}: {
  repetition: number;
  runId: string;
  scenarioId: string;
}) =>
  path.join(devEvalsRoot, runId, "jobs", `${scenarioId}-r${repetition}.json`);

const saveJob = ({ job, runId }: { job: HostJob; runId: string }) => {
  const file = jobFile({
    repetition: job.repetition,
    runId,
    scenarioId: job.scenarioId,
  });
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(job, null, 2)}\n`);
};

const saveState = (state: HostSessionState) => {
  mkdirSync(path.join(devEvalsRoot, state.runId), { recursive: true });
  writeFileSync(
    statePath({ runId: state.runId }),
    `${JSON.stringify(state, null, 2)}\n`
  );
  for (const job of state.jobs) saveJob({ job, runId: state.runId });
};

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

const nextEventSeq = ({ events }: { events: EvalEvent[] }) => {
  let max = 0;
  for (const event of events) if ((event.seq ?? 0) > max) max = event.seq ?? 0;
  return max;
};

const scenarioDirForJob = ({ job, runId }: { job: HostJob; runId: string }) =>
  trialScenarioDir({
    repetition: job.repetition,
    runId,
    scenarioId: job.scenarioId,
  });

const stakeholderMessageForTurn = ({
  job,
  runId,
  turn,
  customTurnOnePrompt,
}: {
  job: HostJob;
  runId: string;
  turn: number;
  customTurnOnePrompt?: string;
}) => {
  const card = loadPublicScenario({ id: job.scenarioId });
  const hidden = loadHiddenScenario({ id: job.scenarioId });
  const scenarioDir = scenarioDirForJob({ job, runId });
  const eventsPath = path.join(scenarioDir, "transcript.jsonl");
  const eventsSoFar = loadTranscript({ eventsPath });
  if (turn === 1 && customTurnOnePrompt) return customTurnOnePrompt;
  return stakeholderReply({
    card,
    events: eventsSoFar,
    hidden,
    scenarioId: job.scenarioId,
    turn,
  });
};

const shouldStopAfterTurn = ({
  hidden,
  turn,
}: {
  hidden?: ReturnType<typeof loadHiddenScenario>;
  turn: number;
}) => hidden?.stopCondition === "after-plan-approval" && turn >= 3;

const buildHostManifest = ({
  arm,
  grades,
  host,
  modelId,
  repetition,
  runId,
  scenarioIds,
  worktreePaths,
}: {
  arm: EvalArm;
  grades: GradeResult[];
  host: EvalHost;
  modelId?: string;
  repetition: number;
  runId: string;
  scenarioIds: string[];
  worktreePaths: string[];
}): RunManifest => {
  const controlCheck =
    arm === "control"
      ? controlArmValid({ worktreePaths })
      : { accepted: [], blocking: [], residuals: [] };
  const allComplete = grades.length === scenarioIds.length * repetition;
  return {
    acceptedControlResiduals:
      arm === "control" ? controlCheck.accepted : undefined,
    agentCliVersion: agentCliVersion(),
    arm,
    catalogHash: catalogHash(),
    completeness:
      allComplete && grades.every((g) => g.officialEligible)
        ? "complete"
        : "partial",
    controlResiduals:
      arm === "control" && controlCheck.blocking.length
        ? controlCheck.blocking
        : undefined,
    cursorVersion: process.env.CURSOR_VERSION ?? "unknown",
    flowSha: currentFlowSha(),
    flowVersion: "0.2",
    harness: "host-session",
    host,
    hypothesis:
      arm === "control"
        ? "Flow arm reduces authorization-set critical failures vs control."
        : undefined,
    modelId: modelId ?? "missing",
    protocol: HOST_SESSION_PROTOCOL_ID,
    repetition,
    rubricVersion,
    runId,
    skillsLockHash: skillsLockHash(),
    sandboxEnabled: true,
    scenarioIds,
    sourceSha: currentFlowSha(),
    trustEnabled: true,
  };
};

export const prepareHostRun = ({
  arm,
  customTurnOneByScenario,
  repetition = 1,
  runId: runIdInput,
  scenarioIds,
}: {
  arm: EvalArm;
  customTurnOneByScenario?: Record<string, string>;
  repetition?: number;
  runId?: string;
  scenarioIds: string[];
}) => {
  const runId = runIdInput ?? `run-${Date.now()}`;
  const flowSha = currentFlowSha();
  const host = detectEvalHost();
  const jobs: HostJob[] = [];

  for (let rep = 1; rep <= repetition; rep += 1)
    for (const scenarioId of scenarioIds) {
      const worktreePath = setupWorktree({
        arm,
        flowSha,
        repetition: rep,
        runId,
        scenarioId,
      }).worktreePath;
      applyScenarioFixture({ scenarioId, worktreePath });
      const prep = finalizePrepBaseline({ worktreePath });
      const card = loadPublicScenario({ id: scenarioId });
      const scenarioDir = trialScenarioDir({
        repetition: rep,
        runId,
        scenarioId,
      });
      mkdirSync(scenarioDir, { recursive: true });
      writeFileSync(path.join(scenarioDir, "transcript.jsonl"), "");
      writeFileSync(path.join(scenarioDir, "stream.raw.log"), "");
      writeSessionMeta({
        prepBaseline: {
          commitSha: prep.commitSha,
          fingerprint: prep.fingerprint,
        },
        scenarioDir,
        worktreePath,
      });
      jobs.push({
        currentTurn: 1,
        prepBaselineSha: prep.commitSha,
        repetition: rep,
        scenarioId,
        status: "pending",
        turnLimit: card.turnCap,
        worktreePath,
      });
    }

  const state: HostSessionState = {
    arm,
    host,
    jobs,
    repetition,
    runId,
    scenarioIds,
  };
  saveState(state);

  const manifest = buildHostManifest({
    arm,
    grades: [],
    host,
    repetition,
    runId,
    scenarioIds,
    worktreePaths: jobs.map((j) => j.worktreePath),
  });
  mkdirSync(path.join(devEvalsRoot, runId), { recursive: true });
  writeFileSync(
    path.join(devEvalsRoot, runId, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  writeFileSync(
    path.join(devEvalsRoot, runId, "scenario-oracle-hash.txt"),
    `${scenarioOracleHash()}\n`
  );

  if (customTurnOneByScenario)
    writeFileSync(
      path.join(devEvalsRoot, runId, "custom-turn-one.json"),
      `${JSON.stringify(customTurnOneByScenario, null, 2)}\n`
    );

  return { host, jobs, ok: true as const, runId };
};

export const hostSessionNext = ({
  repetition,
  runId,
  scenarioId,
}: {
  repetition?: number;
  runId: string;
  scenarioId?: string;
}):
  | { ok: false; reason: string }
  | {
      ok: true;
      runId: string;
      scenarioId?: string;
      status: "done" | "scenario-done";
    }
  | {
      ok: true;
      packet: {
        dispatch: {
          constraints: string;
          fallback: string;
          host: EvalHost;
        };
        prompt?: string;
        repetition: number;
        runId: string;
        scenarioId: string;
        status: "turn";
        turn: number;
        worktreePath: string;
      };
      status: "turn";
    } => {
  const state = loadState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };

  const scoped = state.jobs.filter((job) => {
    if (scenarioId && job.scenarioId !== scenarioId) return false;
    if (repetition && job.repetition !== repetition) return false;
    return true;
  });
  const job = scoped.find((j) => j.status === "pending");
  if (!job)
    return {
      ok: true as const,
      runId,
      scenarioId,
      status: scenarioId ? ("scenario-done" as const) : ("done" as const),
    };

  const customPath = path.join(devEvalsRoot, runId, "custom-turn-one.json");
  const customTurnOne = existsSync(customPath)
    ? (JSON.parse(readFileSync(customPath, "utf-8")) as Record<string, string>)[
        job.scenarioId
      ]
    : undefined;

  const message = stakeholderMessageForTurn({
    customTurnOnePrompt: customTurnOne,
    job,
    runId,
    turn: job.currentTurn,
  });
  if (!message) {
    job.status = "complete";
    saveJob({ job, runId });
    return hostSessionNext({ repetition, runId, scenarioId });
  }

  const scenarioDir = scenarioDirForJob({ job, runId });
  const eventsPath = path.join(scenarioDir, "transcript.jsonl");
  const events = loadTranscript({ eventsPath });
  const seq = nextEventSeq({ events }) + 1;
  const userEvent: EvalEvent = {
    id: `${job.scenarioId}-u${job.currentTurn}`,
    kind: "user",
    origin: "observed",
    scenarioId: job.scenarioId,
    seq,
    text: redactOrThrow({ text: message }),
    ts: new Date().toISOString(),
    turn: job.currentTurn,
  };
  writeFileSync(
    eventsPath,
    `${events.map((e) => JSON.stringify(e)).join("\n")}${events.length ? "\n" : ""}${JSON.stringify(userEvent)}\n`
  );

  job.status = "awaiting-record";
  saveJob({ job, runId });

  return {
    ok: true as const,
    packet: {
      dispatch: {
        constraints:
          "No model flag. No Flow worker subagent roles (builder, researcher, verifier).",
        fallback: "in-session",
        host: state.host,
      },
      prompt: userEvent.text,
      repetition: job.repetition,
      runId,
      scenarioId: job.scenarioId,
      status: "turn" as const,
      turn: job.currentTurn,
      worktreePath: job.worktreePath,
    },
    status: "turn" as const,
  };
};

export const hostSessionRecord = ({
  events,
  repetition,
  runId,
  scenarioId,
  turn,
}: {
  events: EvalEvent[];
  repetition: number;
  runId: string;
  scenarioId: string;
  turn: number;
}) => {
  const state = loadState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };

  const job = state.jobs.find(
    (j) =>
      j.scenarioId === scenarioId &&
      j.repetition === repetition &&
      j.currentTurn === turn &&
      j.status === "awaiting-record"
  );
  if (!job)
    return {
      ok: false as const,
      reason: "no awaiting-record job for scenario/turn",
    };

  const scenarioDir = scenarioDirForJob({ job, runId });
  const eventsPath = path.join(scenarioDir, "transcript.jsonl");
  const existing = loadTranscript({ eventsPath });
  const seq = nextEventSeq({ events: existing });
  const stamped = events.map((event, index) => ({
    ...event,
    origin: event.origin ?? "observed",
    scenarioId: event.scenarioId ?? scenarioId,
    seq: event.seq ?? seq + index + 1,
    turn: event.turn ?? turn,
    ts: event.ts ?? new Date().toISOString(),
  }));
  const lines = stamped.map((e) => JSON.stringify(e)).join("\n");
  writeFileSync(
    eventsPath,
    `${existing.map((e) => JSON.stringify(e)).join("\n")}${existing.length ? "\n" : ""}${lines}\n`
  );

  const hidden = loadHiddenScenario({ id: scenarioId });
  const stop = shouldStopAfterTurn({ hidden, turn: job.currentTurn });
  const atCap = job.currentTurn >= job.turnLimit;
  if (stop || atCap) {
    job.status = "complete";
    job.currentTurn = job.turnLimit + 1;
  } else {
    job.currentTurn += 1;
    job.status = "pending";
  }
  saveJob({ job, runId });

  return { ok: true as const, jobStatus: job.status };
};

const finalizeHostScenario = ({
  job,
  runId,
}: {
  job: HostJob;
  runId: string;
}) => {
  const scenarioDir = scenarioDirForJob({ job, runId });
  const card = loadPublicScenario({ id: job.scenarioId });
  const hidden = loadHiddenScenario({ id: job.scenarioId });
  const oracle = loadScenarioOracle({ id: job.scenarioId });
  const eventsPath = path.join(scenarioDir, "transcript.jsonl");
  const events = loadTranscript({ eventsPath });

  const diffCapture = captureAgentDiff({
    baselineSha: job.prepBaselineSha,
    worktreePath: job.worktreePath,
  });
  writeFileSync(
    path.join(scenarioDir, "diff.patch"),
    redactOrThrow({ text: diffCapture.patch })
  );
  writeFileSync(
    path.join(scenarioDir, "git-status.txt"),
    diffCapture.statusPorcelain
  );

  const grade = gradeObservedScenario({
    card,
    diff: diffCapture.patch,
    events,
    harness: "host-session",
    hidden,
    official: true,
    oracle,
    protocolVerified: true,
    repetition: job.repetition,
    scenarioId: job.scenarioId,
    worktreePath: job.worktreePath,
  });
  const commands = extractCommands({ events });
  writeScenarioReport({ commands, grade, scenarioDir });
  return { grade, worktreePath: job.worktreePath };
};

export const hostSessionFinalize = ({
  modelId,
  runId,
}: {
  modelId?: string;
  runId: string;
}) => {
  const state = loadState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };

  const incomplete = state.jobs.filter((j) => j.status !== "complete");
  if (incomplete.length)
    return {
      ok: false as const,
      reason: `incomplete jobs: ${incomplete.map((j) => `${j.scenarioId}/r${j.repetition}`).join(", ")}`,
    };

  const grades: GradeResult[] = [];
  const worktreePaths: string[] = [];
  for (const job of state.jobs) {
    const result = finalizeHostScenario({ job, runId });
    grades.push(result.grade);
    worktreePaths.push(result.worktreePath);
  }

  if (modelId) state.modelId = modelId;
  saveState(state);

  const manifest = buildHostManifest({
    arm: state.arm,
    grades,
    host: state.host,
    modelId: state.modelId ?? modelId,
    repetition: state.repetition,
    runId,
    scenarioIds: state.scenarioIds,
    worktreePaths,
  });
  const runDir = path.join(devEvalsRoot, runId);
  writeFileSync(
    path.join(runDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  writeRunSummary({ grades, manifest, runDir });

  return { grades, manifest, ok: true as const };
};

export const hostSessionRecordModel = ({
  modelId,
  runId,
}: {
  modelId: string;
  runId: string;
}) => {
  const state = loadState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };
  state.modelId = modelId;
  saveState(state);
  const manifestPath = path.join(devEvalsRoot, runId, "manifest.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(
      readFileSync(manifestPath, "utf-8")
    ) as RunManifest;
    manifest.modelId = modelId;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  return { ok: true as const };
};

export const scenarioWorkerBrief = ({
  repetition = 1,
  runId,
  scenarioId,
}: {
  repetition?: number;
  runId: string;
  scenarioId: string;
}) => {
  const state = loadState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };
  const job = state.jobs.find(
    (item) => item.scenarioId === scenarioId && item.repetition === repetition
  );
  if (!job) return { ok: false as const, reason: "scenario job missing" };
  const prompt = [
    `You are the agent under test for Flow scenario ${scenarioId}, repetition ${repetition}.`,
    `Host repository (eval CLI and evidence only): ${repoRoot}`,
    `Scenario worktree (all scenario edits and reads): ${job.worktreePath}`,
    "Follow the AGENTS.md and Flow docs inside the scenario worktree. That worktree is the product session.",
    "Do not edit the host repository, `.agents/eval`, Flow skills, or this run's grader.",
    "Do not pass a model flag. Do not launch builder, researcher, or verifier roles.",
    "Complete every stakeholder turn yourself. Do not stop after the first turn.",
    "",
    "Loop until next returns scenario-done:",
    `1. From ${repoRoot}: pnpm --filter @repo/flow-eval eval next --run ${runId} --scenario ${scenarioId} --repetition ${repetition}`,
    "2. If status is scenario-done, stop.",
    "3. If status is turn, do the stakeholder prompt inside the scenario worktree.",
    `4. Write an events JSON array (at least one assistant event, origin observed) and run: pnpm --filter @repo/flow-eval eval record --run ${runId} --scenario ${scenarioId} --turn <n> --repetition ${repetition} --events-file <absolute path>`,
    "",
    "Return a report to the parent session only:",
    "- scenarioId",
    "- turns completed",
    "- issues: workflow failures, unauthorized build, missing verification, or blockers, with evidence",
    "- fixPlan: proposed methodology or harness changes. Do not apply them.",
    "- commands you ran and exit codes when known",
  ].join("\n");
  return {
    ok: true as const,
    prompt,
    repetition,
    runId,
    scenarioId,
    worktreePath: job.worktreePath,
  };
};
