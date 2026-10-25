import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { agentCliVersion, writeSessionMeta } from "./agent.ts";
import { controlArmValid } from "./compare.ts";
import { extractCommands } from "./evidence.ts";
import type { GeneratedScenario } from "./generation/types.ts";
import { currentFlowSha, recordCommonSource } from "./git.ts";
import {
  hostSessionProtocolVerified,
  runnerCaptureCompleteForScenario,
  runnerTranscriptFileName,
} from "./host-protocol.ts";
import type { DatabaseLifecycleStatus } from "./infrastructure/database.ts";
import {
  cleanupSubjectDatabase,
  prepareSubjectDatabase,
} from "./infrastructure/database.ts";
import { captureAgentDiff } from "./isolate.ts";
import { assessIsolationFromTrial } from "./isolation-trial.ts";
import {
  assessIsolation,
  officialEligibilityBlockersFromIsolation,
  SUBJECT_EVALUATOR_PROTOCOL_ID,
} from "./isolation.ts";
import { runEvalDir } from "./paths.ts";
import { prepareInstalledSubject } from "./product/prepare-installed-product.ts";
import { validateSubjectRecordEvents } from "./record-validation.ts";
import { redactOrThrow } from "./redact.ts";
import { writeRunSummary, writeScenarioReport } from "./report.ts";
import { requiresDatabase } from "./requires-database.ts";
import { rubricVersion } from "./rubric.ts";
import { isTrustedRunnerEventsFile } from "./runner-capture.ts";
import { validateRunnerObserveEvents } from "./runner-record-validation.ts";
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
import { resolveScenarioCompleteness } from "./trace.ts";
import { mergeSubjectAndRunnerTranscripts } from "./transcript-merge.ts";
import { loadTranscript } from "./transcript.ts";
import { trialScenarioDir } from "./trial-paths.ts";
import type {
  CommonSourceIdentity,
  EvalArm,
  EvalEvent,
  EvalHost,
  GradeResult,
  HostJobStatus,
  PreparedSourceIdentity,
  RunManifest,
  TrustedEvaluatorRevision,
} from "./types.ts";

export const detectEvalHost = (): EvalHost => {
  if (process.env.CLAUDE_CODE === "1" || process.env.CLAUDECODE === "1")
    return "claude";
  if (
    process.env.CURSOR_AGENT === "1" ||
    process.env.CURSOR_TRACE_ID ||
    process.env.CURSOR_SESSION_ID
  )
    return "cursor";
  return "other";
};

const loadMergedEventsForScenario = ({
  scenarioDir,
}: {
  scenarioDir: string;
}) => {
  const subjectPath = path.join(scenarioDir, "transcript.jsonl");
  const runnerPath = path.join(scenarioDir, runnerTranscriptFileName);
  const subjectEvents = loadTranscript({ eventsPath: subjectPath });
  const runnerEvents = existsSync(runnerPath)
    ? loadTranscript({ eventsPath: runnerPath })
    : [];
  return mergeSubjectAndRunnerTranscripts({
    runnerEvents,
    subjectEvents,
  });
};

type HostJob = {
  scenarioId: string;
  repetition: number;
  turnLimit: number;
  currentTurn: number;
  status: HostJobStatus;
  attemptId: number;
  worktreePath: string;
  prepBaselineSha: string;
  preparedWorkspace?: PreparedSourceIdentity;
  lastRecordedFingerprint?: string;
  lastRecordedTurn?: number;
  failureReason?: string;
  databaseName?: string;
  databaseLifecycle?: DatabaseLifecycleStatus;
  subjectKey?: string;
};

const terminalJobStatuses = new Set<HostJobStatus>([
  "complete",
  "failed",
  "blocked",
  "timed-out",
  "cancelled",
]);

const normalizeHostJob = (job: HostJob): HostJob => ({
  ...job,
  attemptId: job.attemptId ?? 1,
  status: job.status ?? "pending",
});

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
  path.join(runEvalDir(runId), "host-session-state.json");

const generatedScenariosPath = ({ runId }: { runId: string }) =>
  path.join(runEvalDir(runId), "generated-scenarios.json");

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
    if (!existsSync(overlay)) return normalizeHostJob(job);
    return normalizeHostJob(
      JSON.parse(readFileSync(overlay, "utf-8")) as HostJob
    );
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
}) => path.join(runEvalDir(runId), "jobs", `${scenarioId}-r${repetition}.json`);

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
  mkdirSync(path.join(runEvalDir(state.runId)), { recursive: true });
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
  isolationAssessment,
  modelId,
  runnerCaptureComplete = true,
  state,
  repetition,
  runId,
  scenarioIds,
  worktreePaths,
}: {
  arm: EvalArm;
  grades: GradeResult[];
  host: EvalHost;
  isolationAssessment?: ReturnType<typeof assessIsolationFromTrial>;
  modelId?: string;
  runnerCaptureComplete?: boolean;
  state: HostSessionState;
  repetition: number;
  runId: string;
  scenarioIds: string[];
  worktreePaths: string[];
}): RunManifest => {
  const commonSource = state.commonSource;
  const sourceSha = commonSource?.commitSha ?? currentFlowSha();
  const isolation =
    isolationAssessment ??
    assessIsolation({ host, protocol: SUBJECT_EVALUATOR_PROTOCOL_ID });
  const isolationBlockers = officialEligibilityBlockersFromIsolation(isolation);
  const isolationCapabilities = Object.fromEntries(
    Object.entries(isolation.capabilities).map(([key, value]) => [
      key,
      value ?? "unknown",
    ])
  );
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
    isolationCapabilities,
    modelId: modelId ?? "missing",
    officialComparisonAllowed: isolation.officialComparisonAllowed,
    preparedSource: state.preparedSource,
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
    repetition,
    rubricVersion,
    runId,
    runnerCaptureComplete,
    scenarioIds,
    scenarioOracleHash: state.frozenScenarioOracleHash ?? scenarioOracleHash(),
    skillsLockHash: state.frozenSkillsLockHash ?? skillsLockHash(),
    sandboxEnabled: false,
    sourceSha,
    trustedEvaluatorRevision: state.trustedEvaluatorRevision,
    trustEnabled: false,
  };
};

const cleanupJobsDatabases = async ({
  jobs,
  runId,
}: {
  jobs: HostJob[];
  runId: string;
}) => {
  await Promise.all(
    jobs.map(async (job) => {
      if (!job.databaseName) return;
      const result = await cleanupSubjectDatabase({
        databaseName: job.databaseName,
        runId,
      });
      if (job.databaseLifecycle)
        job.databaseLifecycle.cleanup =
          result.cleanup === "passed"
            ? "passed"
            : result.cleanup === "skipped"
              ? "skipped"
              : "failed";
    })
  );
};

export const prepareHostRun = async ({
  arm,
  copySkills = true,
  customTurnOneByScenario,
  generatedScenarios,
  host: hostOverride,
  repetition = 1,
  runId: runIdInput,
  scenarioIds,
}: {
  arm: EvalArm;
  copySkills?: boolean;
  customTurnOneByScenario?: Record<string, string>;
  generatedScenarios?: GeneratedScenario[];
  host?: EvalHost;
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
  const host = hostOverride ?? detectEvalHost();
  const jobs: HostJob[] = [];
  const generatedById = new Map(
    (generatedScenarios ?? []).map((s) => [s.id, s] as const)
  );

  const prepareJobs = scenarioIds.flatMap((scenarioId) =>
    Array.from({ length: repetition }, (_, index) => ({
      rep: index + 1,
      scenarioId,
    }))
  );

  for (const { rep, scenarioId } of prepareJobs) {
    const prepareNonce = `${runId}-${scenarioId}-${rep}-${Date.now()}`;
    let worktreePath: string;
    let trialRunnerMeta: Record<string, unknown>;
    let prep: PreparedSourceIdentity & {
      commitSha: string;
      fingerprint: string;
      recordedAt: string;
      treeSha: string;
    };
    let databaseLifecycle: DatabaseLifecycleStatus | undefined;
    let databaseName: string | undefined;
    let subjectKey: string | undefined;
    let jobStatus: HostJobStatus = "pending";
    let failureReason: string | undefined;

    try {
      const prepared = prepareInstalledSubject({
        arm,
        copySkills,
        flowSha,
        prepareNonce,
        repetition: rep,
        runId,
        scenarioId,
        withFixture: !generatedById.has(scenarioId),
        withSetup: process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP !== "1",
      });
      worktreePath = prepared.worktreePath;
      trialRunnerMeta = prepared.trialRunnerMeta as Record<string, unknown>;
      prep = prepared.prep;
      if (requiresDatabase({ command: "host-prepare", scenarioId })) {
        // eslint-disable-next-line no-await-in-loop -- sequential database provisioning per host job
        const dbRecord = await prepareSubjectDatabase({
          identity: prepared.identity,
          runId,
          worktreePath,
        });
        databaseLifecycle = dbRecord.lifecycle;
        databaseName = dbRecord.databaseName;
        subjectKey = dbRecord.subjectKey;
        trialRunnerMeta = {
          ...trialRunnerMeta,
          database: databaseLifecycle,
        };
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "subject preparation failed";
      jobStatus = "blocked";
      failureReason = message;
      worktreePath = "";
      trialRunnerMeta = { scenarioId, runId, arm };
      prep = {
        commitSha: "",
        fingerprint: "",
        recordedAt: new Date().toISOString(),
        treeSha: "",
      };
    }

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
    writeFileSync(path.join(scenarioDir, runnerTranscriptFileName), "");
    writeFileSync(path.join(scenarioDir, "stream.raw.log"), "");
    writeSessionMeta({
      prepBaseline: {
        commitSha: prep.commitSha,
        fingerprint: prep.fingerprint,
      },
      scenarioDir,
      trialRunnerMeta,
      worktreePath,
    });
    jobs.push({
      attemptId: 1,
      currentTurn: 1,
      databaseLifecycle,
      databaseName,
      failureReason,
      prepBaselineSha: prep.commitSha,
      preparedWorkspace,
      repetition: rep,
      scenarioId,
      status: jobStatus,
      subjectKey,
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
  mkdirSync(runEvalDir(runId), { recursive: true });
  writeFileSync(
    path.join(runEvalDir(runId), "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  writeFileSync(
    path.join(runEvalDir(runId), "scenario-oracle-hash.txt"),
    `${scenarioOracleHash()}\n`
  );

  if (customTurnOneByScenario)
    writeFileSync(
      path.join(runEvalDir(runId), "custom-turn-one.json"),
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

  const customPath = path.join(runEvalDir(runId), "custom-turn-one.json");
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

export const hostSessionObserve = ({
  events,
  eventsFilePath,
  repetition,
  runId,
  scenarioId,
  turn,
}: {
  events: EvalEvent[];
  eventsFilePath?: string;
  repetition: number;
  runId: string;
  scenarioId: string;
  turn: number;
}) => {
  const state = loadHostSessionState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };

  const job = state.jobs.find(
    (j) =>
      j.scenarioId === scenarioId &&
      j.repetition === repetition &&
      (j.lastRecordedTurn === turn ||
        (j.status === "awaiting-record" && j.currentTurn === turn))
  );
  if (!job)
    return {
      ok: false as const,
      reason: "no job for scenario/turn (record subject turn first)",
    };

  const scenarioDir = scenarioDirForJob({ job, runId });
  if (eventsFilePath) {
    if (!isTrustedRunnerEventsFile({ eventsFile: eventsFilePath, scenarioDir }))
      return {
        ok: false as const,
        reason:
          "events file must be runner-capture/events.json with valid capture-manifest.json",
      };
  }

  const validated = validateRunnerObserveEvents({
    events,
    repetition,
    runId,
    scenarioId,
    turn,
  });
  if (!validated.ok) return { ok: false as const, reason: validated.reason };
  const runnerPath = path.join(scenarioDir, runnerTranscriptFileName);
  const existing = existsSync(runnerPath)
    ? loadTranscript({ eventsPath: runnerPath })
    : [];
  const seq = nextEventSeq({ events: existing });
  const stamped = validated.events.map((event, index) => ({
    ...event,
    seq: event.seq ?? seq + index + 1,
    ts: event.ts ?? new Date().toISOString(),
    turn: event.turn ?? turn,
  }));
  writeFileSync(
    runnerPath,
    `${existing.map((e) => JSON.stringify(e)).join("\n")}${existing.length ? "\n" : ""}${stamped.map((e) => JSON.stringify(e)).join("\n")}\n`
  );

  return { ok: true as const, observed: stamped.length };
};

const finalizeHostScenario = ({
  job,
  modelId,
  runId,
}: {
  job: HostJob;
  modelId?: string;
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
  const events = loadMergedEventsForScenario({ scenarioDir });
  const completeness = resolveScenarioCompleteness({
    events,
    harness: "host-session",
    official: true,
    oracle,
  });
  const protocolVerified = hostSessionProtocolVerified({
    card,
    completeness,
    mergedEvents: events,
  });

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

  const state = loadHostSessionState({ runId });
  const host = state?.host ?? detectEvalHost();
  const isolation = assessIsolationFromTrial({
    host,
    modelId,
    protocol: SUBJECT_EVALUATOR_PROTOCOL_ID,
    scenarioDir,
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
    protocolVerified,
    repetition: job.repetition,
    runId,
    scenarioId: job.scenarioId,
    worktreePath: job.worktreePath,
  });
  const commands = extractCommands({ events });
  writeScenarioReport({ commands, grade, scenarioDir });
  const runnerCaptureComplete = runnerCaptureCompleteForScenario({
    card,
    mergedEvents: events,
  });
  return {
    grade,
    isolation,
    runnerCaptureComplete,
    worktreePath: job.worktreePath,
  };
};

export const hostSessionFinalize = async ({
  modelId,
  runId,
}: {
  modelId?: string;
  runId: string;
}) => {
  const state = loadHostSessionState({ runId });
  if (!state)
    return { ok: false as const, reason: "host session state missing" };

  const incomplete = state.jobs.filter(
    (j) => !terminalJobStatuses.has(j.status)
  );
  const gradable = state.jobs.filter((j) => j.status === "complete");
  if (!gradable.length && incomplete.length)
    return {
      ok: false as const,
      reason: `no completed jobs; still running: ${incomplete.map((j) => `${j.scenarioId}/r${j.repetition}`).join(", ")}`,
    };

  const grades: GradeResult[] = [];
  const worktreePaths: string[] = [];
  let isolationAssessment:
    | ReturnType<typeof assessIsolationFromTrial>
    | undefined;
  let runnerCaptureComplete = true;
  const resolvedModelId = state.modelId ?? modelId;
  for (const job of gradable) {
    const result = finalizeHostScenario({
      job,
      modelId: resolvedModelId,
      runId,
    });
    grades.push(result.grade);
    worktreePaths.push(result.worktreePath);
    isolationAssessment = result.isolation;
    runnerCaptureComplete &&= result.runnerCaptureComplete;
  }

  if (modelId) state.modelId = modelId;
  await cleanupJobsDatabases({ jobs: state.jobs, runId });
  saveState(state);

  const manifest = buildHostManifest({
    arm: state.arm,
    grades,
    host: state.host,
    isolationAssessment,
    modelId: state.modelId ?? modelId,
    repetition: state.repetition,
    runId,
    runnerCaptureComplete,
    scenarioIds: state.scenarioIds,
    state,
    worktreePaths,
  });
  const runDir = runEvalDir(runId);
  writeFileSync(
    path.join(runDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  writeRunSummary({
    grades,
    hostJobs: state.jobs,
    manifest,
    partial: incomplete.length > 0,
    runDir,
  });

  return {
    grades,
    incompleteJobs: incomplete.map(
      (j) => `${j.scenarioId}/r${j.repetition}:${j.status}`
    ),
    manifest,
    ok: true as const,
    partial: incomplete.length > 0,
  };
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
