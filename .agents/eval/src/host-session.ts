import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { agentCliVersion, writeSessionMeta } from "./agent.ts";
import { controlArmValid } from "./compare.ts";
import { extractCommands } from "./evidence.ts";
import type { GeneratedScenario } from "./generation/types.ts";
import { currentFlowSha, recordCommonSource } from "./git.ts";
import {
  applyScenarioFixture,
  captureAgentDiff,
  finalizePrepBaseline,
  setupWorktree,
} from "./isolate.ts";
import {
  assessIsolation,
  officialEligibilityBlockersFromIsolation,
  SUBJECT_EVALUATOR_PROTOCOL_ID,
} from "./isolation.ts";
import { devEvalsRoot } from "./paths.ts";
import { validateSubjectRecordEvents } from "./record-validation.ts";
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
import { subjectTaskPrompt } from "./subject-prompt.ts";
import { loadTranscript } from "./transcript.ts";
import { trialScenarioDir } from "./trial-paths.ts";
import type {
  CommonSourceIdentity,
  EvalArm,
  EvalEvent,
  EvalHost,
  GradeResult,
  PreparedSourceIdentity,
  RunManifest,
  TrustedEvaluatorRevision,
} from "./types.ts";

const detectEvalHost = (): EvalHost => {
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
  preparedWorkspace?: PreparedSourceIdentity;
  lastRecordedFingerprint?: string;
  lastRecordedTurn?: number;
};

type HostSessionState = {
  arm: EvalArm;
  host: EvalHost;
  jobs: HostJob[];
  modelId?: string;
  commonSource?: CommonSourceIdentity;
  trustedEvaluatorRevision?: TrustedEvaluatorRevision;
  frozenCatalogHash?: string;
  frozenScenarioOracleHash?: string;
  frozenSkillsLockHash?: string;
  /** @deprecated legacy field; do not synthesize when missing */
  preparedSource?: PreparedSourceIdentity;
  repetition: number;
  runId: string;
  scenarioIds: string[];
};

const statePath = ({ runId }: { runId: string }) =>
  path.join(devEvalsRoot, runId, "host-session-state.json");

const generatedScenariosPath = ({ runId }: { runId: string }) =>
  path.join(devEvalsRoot, runId, "generated-scenarios.json");

const loadGeneratedScenariosById = ({ runId }: { runId: string }) => {
  const file = generatedScenariosPath({ runId });
  if (!existsSync(file)) return new Map<string, GeneratedScenario>();
  const raw = JSON.parse(readFileSync(file, "utf-8")) as Record<
    string,
    GeneratedScenario
  >;
  return new Map(Object.entries(raw));
};

const saveGeneratedScenarios = ({
  runId,
  scenarios,
}: {
  runId: string;
  scenarios: GeneratedScenario[];
}) => {
  if (!scenarios.length) return;
  const byId = Object.fromEntries(scenarios.map((s) => [s.id, s]));
  writeFileSync(
    generatedScenariosPath({ runId }),
    `${JSON.stringify(byId, null, 2)}\n`
  );
};

export const loadHostSessionState = ({ runId }: { runId: string }) => {
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
  const generated = loadGeneratedScenariosById({ runId }).get(job.scenarioId);
  const card =
    generated?.publicCard ?? loadPublicScenario({ id: job.scenarioId });
  const hidden =
    generated?.hidden ?? loadHiddenScenario({ id: job.scenarioId });
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
}) => stopAfterRecordedTurn({ hidden, turn });

const buildHostManifest = ({
  arm,
  grades,
  host,
  modelId,
  state,
  repetition,
  runId,
  scenarioIds,
  worktreePaths,
}: {
  arm: EvalArm;
  grades: GradeResult[];
  host: EvalHost;
  modelId?: string;
  state: HostSessionState;
  repetition: number;
  runId: string;
  scenarioIds: string[];
  worktreePaths: string[];
}): RunManifest => {
  const commonSource = state.commonSource;
  const sourceSha = commonSource?.commitSha ?? currentFlowSha();
  const isolation = assessIsolation({
    host,
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
  });
  const isolationBlockers = officialEligibilityBlockersFromIsolation(isolation);
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
    completeness: allComplete ? "complete" : "partial",
    controlResiduals:
      arm === "control" && controlCheck.blocking.length
        ? controlCheck.blocking
        : undefined,
    cursorVersion: process.env.CURSOR_VERSION ?? "unknown",
    catalogHash: state.frozenCatalogHash ?? catalogHash(),
    commonSource,
    flowSha: sourceSha,
    flowVersion: "0.3",
    frozenCatalogHash: state.frozenCatalogHash,
    frozenScenarioOracleHash: state.frozenScenarioOracleHash,
    frozenSkillsLockHash: state.frozenSkillsLockHash,
    harness: "host-session",
    host,
    isolationBlockers,
    modelId: modelId ?? "missing",
    officialComparisonAllowed: isolation.officialComparisonAllowed,
    preparedSource: state.preparedSource,
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
    repetition,
    rubricVersion,
    runId,
    scenarioIds,
    scenarioOracleHash: state.frozenScenarioOracleHash ?? scenarioOracleHash(),
    skillsLockHash: state.frozenSkillsLockHash ?? skillsLockHash(),
    sandboxEnabled: false,
    sourceSha,
    trustedEvaluatorRevision: state.trustedEvaluatorRevision,
    trustEnabled: false,
  };
};

export const prepareHostRun = ({
  arm,
  customTurnOneByScenario,
  generatedScenarios,
  repetition = 1,
  runId: runIdInput,
  scenarioIds,
}: {
  arm: EvalArm;
  customTurnOneByScenario?: Record<string, string>;
  generatedScenarios?: GeneratedScenario[];
  repetition?: number;
  runId?: string;
  scenarioIds: string[];
}) => {
  const runId = runIdInput ?? `run-${Date.now()}`;
  const flowSha = currentFlowSha();
  const commonSource = recordCommonSource();
  const trustedEvaluatorRevision: TrustedEvaluatorRevision = {
    commitSha: flowSha,
    recordedAt: new Date().toISOString(),
  };
  const frozenCatalogHash = catalogHash();
  const frozenScenarioOracleHash = scenarioOracleHash();
  const frozenSkillsLockHash = skillsLockHash();
  const host = detectEvalHost();
  const jobs: HostJob[] = [];
  const generatedById = new Map(
    (generatedScenarios ?? []).map((s) => [s.id, s] as const)
  );

  for (let rep = 1; rep <= repetition; rep += 1)
    for (const scenarioId of scenarioIds) {
      const worktreePath = setupWorktree({
        arm,
        flowSha,
        repetition: rep,
        runId,
        scenarioId,
      }).worktreePath;
      if (!generatedById.has(scenarioId))
        applyScenarioFixture({ scenarioId, worktreePath });
      const prep = finalizePrepBaseline({ worktreePath });
      const preparedWorkspace: PreparedSourceIdentity = {
        commitSha: prep.commitSha,
        fingerprint: prep.fingerprint,
        recordedAt: prep.recordedAt,
        treeSha: prep.treeSha,
      };
      const card =
        generatedById.get(scenarioId)?.publicCard ??
        loadPublicScenario({ id: scenarioId });
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
        preparedWorkspace,
        repetition: rep,
        scenarioId,
        status: "pending",
        turnLimit: card.turnCap,
        worktreePath,
      });
    }

  const state: HostSessionState = {
    arm,
    commonSource,
    frozenCatalogHash,
    frozenScenarioOracleHash,
    frozenSkillsLockHash,
    host,
    jobs,
    repetition,
    runId,
    scenarioIds,
    trustedEvaluatorRevision,
  };
  saveState(state);

  const manifest = buildHostManifest({
    arm,
    grades: [],
    host,
    repetition,
    runId,
    scenarioIds,
    state,
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

  if (generatedScenarios?.length)
    saveGeneratedScenarios({ runId, scenarios: generatedScenarios });

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
    }
  | {
      ok: true;
      packet: {
        repetition: number;
        runId: string;
        scenarioId: string;
        status: "awaiting-record";
        turn: number;
        worktreePath: string;
      };
      status: "awaiting-record";
    } => {
  const state = loadHostSessionState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };

  const scoped = state.jobs.filter((job) => {
    if (scenarioId && job.scenarioId !== scenarioId) return false;
    if (repetition !== undefined && job.repetition !== repetition) return false;
    return true;
  });
  const awaitingRecord = scoped.find((j) => j.status === "awaiting-record");
  if (awaitingRecord)
    return {
      ok: true as const,
      packet: {
        repetition: awaitingRecord.repetition,
        runId,
        scenarioId: awaitingRecord.scenarioId,
        status: "awaiting-record" as const,
        turn: awaitingRecord.currentTurn,
        worktreePath: awaitingRecord.worktreePath,
      },
      status: "awaiting-record" as const,
    };

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
    if (job.currentTurn < job.turnLimit) {
      job.currentTurn += 1;
      job.status = "pending";
      saveJob({ job, runId });
      return hostSessionNext({ repetition, runId, scenarioId });
    }
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
  const state = loadHostSessionState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };

  if (!events.length || !events.some((event) => event.kind === "assistant"))
    return {
      ok: false as const,
      reason: "record requires at least one assistant event",
    };

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
  const validated = validateSubjectRecordEvents({
    events,
    repetition,
    runId,
    scenarioId,
    turn,
  });
  if (!validated.ok) return { ok: false as const, reason: validated.reason };

  const fingerprint = validated.fingerprint;
  const recordedThisTurn = job.lastRecordedTurn === turn;
  if (
    recordedThisTurn &&
    job.lastRecordedFingerprint &&
    job.lastRecordedFingerprint !== fingerprint
  )
    return {
      ok: false as const,
      reason: "conflicting record for the same turn",
    };
  if (recordedThisTurn && job.lastRecordedFingerprint === fingerprint)
    return { ok: true as const, jobStatus: job.status, reused: true as const };

  const submissionsDir = path.join(scenarioDir, "submissions");
  mkdirSync(submissionsDir, { recursive: true });
  const submissionPath = path.join(
    submissionsDir,
    `t${turn}-${fingerprint}.json`
  );
  const redactedSubmission = validated.events.map((event) =>
    event.text === undefined
      ? event
      : { ...event, text: redactOrThrow({ text: event.text }) }
  );
  writeFileSync(
    submissionPath,
    `${JSON.stringify(
      {
        channel: "subject-submitted",
        events: redactedSubmission,
        fingerprint,
        recordedAt: new Date().toISOString(),
        repetition,
        runId,
        scenarioId,
        turn,
      },
      null,
      2
    )}\n`
  );

  const stamped = validated.events.map((event, index) => {
    const base = {
      ...event,
      scenarioId: event.scenarioId ?? scenarioId,
      seq: event.seq ?? seq + index + 1,
      turn: event.turn ?? turn,
      ts: event.ts ?? new Date().toISOString(),
    };
    return base.text === undefined
      ? base
      : { ...base, text: redactOrThrow({ text: base.text }) };
  });
  const lines = stamped.map((e) => JSON.stringify(e)).join("\n");
  writeFileSync(
    eventsPath,
    `${existing.map((e) => JSON.stringify(e)).join("\n")}${existing.length ? "\n" : ""}${lines}\n`
  );

  const generated = loadGeneratedScenariosById({ runId }).get(scenarioId);
  const hidden = generated?.hidden ?? loadHiddenScenario({ id: scenarioId });
  const stop = shouldStopAfterTurn({ hidden, turn: job.currentTurn });
  const atCap = job.currentTurn >= job.turnLimit;
  if (stop || atCap) {
    job.status = "complete";
    job.currentTurn = job.turnLimit + 1;
  } else {
    job.currentTurn += 1;
    job.status = "pending";
  }
  job.lastRecordedFingerprint = fingerprint;
  job.lastRecordedTurn = turn;
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
  const generated = loadGeneratedScenariosById({ runId }).get(job.scenarioId);
  const card =
    generated?.publicCard ?? loadPublicScenario({ id: job.scenarioId });
  const hidden =
    generated?.hidden ?? loadHiddenScenario({ id: job.scenarioId });
  const oracle = generated?.oracle ??
    loadScenarioOracle({ id: job.scenarioId }) ?? {
      scenarioId: job.scenarioId,
    };
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

  const isolation = assessIsolation({
    host: detectEvalHost(),
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
  });
  const grade = gradeObservedScenario({
    card,
    diff: diffCapture.patch,
    events,
    harness: "host-session",
    hidden,
    isolationBlockers: officialEligibilityBlockersFromIsolation(isolation),
    official: true,
    oracle,
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
    protocolVerified: false,
    repetition: job.repetition,
    runId,
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
  const state = loadHostSessionState({ runId });
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
    state,
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

export const scenarioWorkerBrief = ({
  repetition = 1,
  runId,
  scenarioId,
  session,
}: {
  repetition?: number;
  runId: string;
  scenarioId: string;
  session?: NonNullable<ReturnType<typeof loadHostSessionState>>;
}) => {
  const state = session ?? loadHostSessionState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };
  const job = state.jobs.find(
    (item) => item.scenarioId === scenarioId && item.repetition === repetition
  );
  if (!job) return { ok: false as const, reason: "scenario job missing" };
  const prompt = subjectTaskPrompt({ worktreePath: job.worktreePath });
  return {
    ok: true as const,
    prompt,
    repetition,
    runId,
    scenarioId,
    worktreePath: job.worktreePath,
  };
};
