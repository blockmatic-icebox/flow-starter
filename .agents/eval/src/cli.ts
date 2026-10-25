import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { compareRuns } from "./compare.ts";
import { runExperiment } from "./generation/experiment.ts";
import { stratifiedMethodologySample } from "./generation/methodology-sample.ts";
import { createSeededRng, randomSeed } from "./generation/rng.ts";
import { runSelfImproveCampaign } from "./generation/self-improve.ts";
import { gradeScenarioFromRunDir } from "./grade-from-run.ts";
import { handoffAgentBPrompt } from "./handoff.ts";
import {
  hostSessionFinalize,
  hostSessionNext,
  hostSessionRecord,
  loadHostSessionState,
  prepareHostRun,
  scenarioWorkerBrief,
} from "./host-session.ts";
import { runBatch } from "./orchestrate.ts";
import { devEvalsRoot, baselineRunId } from "./paths.ts";
import { verifyBaselinePreserved } from "./preserve.ts";
import {
  runMutationIntegrity,
  runOfflineBenchmark,
} from "./product/mutations.ts";
import { writeProductEvalArtifacts } from "./product/persist.ts";
import { evaluateReadiness } from "./product/readiness.ts";
import { findingsFromReadiness } from "./product/remediate.ts";
import { createHostRepairExecutor } from "./product/repair-executor.ts";
import { runStressEvaluation } from "./product/stress.ts";
import { listPublicScenarioIds } from "./scenarios.ts";
import type { EvalArm, EvalEvent } from "./types.ts";

const usage = () => {
  console.log(`flow-eval CLI

Usage:
  pnpm --filter @repo/flow-eval eval preserve
  pnpm --filter @repo/flow-eval eval grade --run <runId> --scenario <id>
  pnpm --filter @repo/flow-eval eval prepare [--arm flow] [--suite | --scenarios S01,S13] [--run-id <id>] [--repetition N]
  pnpm --filter @repo/flow-eval eval briefs --run <runId>
  pnpm --filter @repo/flow-eval eval next --run <runId> [--scenario <id>] [--repetition N]
  pnpm --filter @repo/flow-eval eval record --run <runId> --scenario <id> --turn <n> [--repetition N] --events-file <path>
  pnpm --filter @repo/flow-eval eval finalize --run <runId> [--model-id <id>]
  pnpm --filter @repo/flow-eval eval pilot [--scenarios S01,S13]
  pnpm --filter @repo/flow-eval eval run --scenarios S01,S02 [--arm flow] [--dry-run]
  pnpm --filter @repo/flow-eval eval compare --baseline <runId> --current <runId> [--remediation]
  pnpm --filter @repo/flow-eval eval pilot-loop [--dry-run]
  pnpm --filter @repo/flow-eval eval compare-arms [--scenarios S05,S09,S13] [--dry-run]
  pnpm --filter @repo/flow-eval eval handoff --variant C1 [--dry-run]
  pnpm --filter @repo/flow-eval eval readiness [--run <id>]
  pnpm --filter @repo/flow-eval eval stress [--run <id>] [--cycles N]
  pnpm --filter @repo/flow-eval eval mutations
  pnpm --filter @repo/flow-eval eval benchmark --id benchmark-a|benchmark-b
  pnpm --filter @repo/flow-eval eval experiment [--profile full-product|mixed|technical-ai-assessment] [--count N] [--seed <seed>] [--dry-run]
  pnpm --filter @repo/flow-eval eval self-improve [--iterations 3] [--seed <seed>] [--dry-run] [--resume <campaign-id>]

Live runs use host-session (/flow-eval). No --model flag.
`);
};

const parseArgs = (argv: string[]) => {
  const [command, ...rest] = argv;
  const flags: Record<string, string | boolean> = {
    command: command ?? "",
  };
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token?.startsWith("--")) continue;
    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith("--")) flags[key] = true;
    else {
      flags[key] = next;
      i += 1;
    }
  }
  return flags;
};

const validArms = new Set<EvalArm>(["flow", "flow-without-skills", "control"]);

const assertScenarioIds = ({ ids }: { ids: string[] }) => {
  const known = new Set(listPublicScenarioIds());
  const invalid = ids.filter((id) => !known.has(id));
  if (invalid.length) {
    console.error(`Unknown scenario id(s): ${invalid.join(", ")}`);
    process.exit(3);
  }
};

const assertArm = ({ arm }: { arm: string }) => {
  if (!validArms.has(arm as EvalArm)) {
    console.error(`Invalid arm: ${arm}`);
    process.exit(3);
  }
};

const cmdPreserve = () => {
  const result = verifyBaselinePreserved();
  if (result.status === "mismatch" || !result.ok) {
    console.error("Baseline integrity check failed:");
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  if (result.status === "unavailable") {
    console.log(
      `Baseline ${baselineRunId}: historical evidence unavailable on this checkout (${result.missingEvidence?.length ?? 0} documented gaps in index).`
    );
    return;
  }
  console.log(
    `Baseline ${baselineRunId} preserved (${result.missingEvidence?.length ?? 0} documented gaps).`
  );
};

const cmdGrade = ({
  runId,
  scenarioId,
}: {
  runId: string;
  scenarioId: string;
}) => {
  assertScenarioIds({ ids: [scenarioId] });
  const grade = gradeScenarioFromRunDir({ runId, scenarioId });
  console.log(JSON.stringify(grade, null, 2));
  if (grade.gate === "fail" || !grade.officialEligible) process.exit(1);
};

const writeRemediationProposal = ({
  runId,
  findings,
}: {
  runId: string;
  findings: { id: string; status: string; summary: string }[];
}) => {
  const runDir = path.join(devEvalsRoot, runId);
  mkdirSync(runDir, { recursive: true });
  const lines = [
    "# Remediation proposal",
    "",
    `Run: ${runId}`,
    "",
    "Review before any workflow or skill edits. Implementation requires explicit finding-id authorization.",
    "",
    ...findings.map(
      (f) => `## ${f.id}\n\n**Status:** ${f.status}\n\n${f.summary}\n`
    ),
  ];
  writeFileSync(
    path.join(runDir, "remediation-proposal.md"),
    `${lines.join("\n")}\n`
  );
};

const awaitBatch = async (input: Parameters<typeof runBatch>[0]) =>
  await runBatch(input);

const printAwaitingHost = ({
  runId,
  host,
}: {
  runId: string;
  host: string;
}) => {
  console.log(
    JSON.stringify(
      {
        host,
        message:
          "Complete via /flow-eval: eval next → host subagent → eval record → repeat → eval finalize",
        runId,
        status: "awaiting-host",
      },
      null,
      2
    )
  );
};

const cmdPrepare = ({
  arm,
  repetition,
  runId,
  scenarios,
}: {
  arm: EvalArm;
  repetition: number;
  runId?: string;
  scenarios: string[];
}) => {
  assertScenarioIds({ ids: scenarios });
  assertArm({ arm });
  const prep = prepareHostRun({
    arm,
    repetition,
    runId,
    scenarioIds: scenarios,
  });
  console.log(JSON.stringify(prep, null, 2));
};

const cmdNext = ({
  repetition,
  runId,
  scenarioId,
}: {
  repetition?: number;
  runId: string;
  scenarioId?: string;
}) => {
  const result = hostSessionNext({ repetition, runId, scenarioId });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
};

const cmdBriefs = ({ runId }: { runId: string }) => {
  const state = loadHostSessionState({ runId });
  if (!state) {
    console.error("host session state missing");
    process.exit(1);
  }
  const briefs = state.jobs.map((job) =>
    scenarioWorkerBrief({
      repetition: job.repetition,
      runId,
      scenarioId: job.scenarioId,
      session: state,
    })
  );
  console.log(JSON.stringify(briefs, null, 2));
  if (briefs.some((brief) => !brief.ok)) process.exit(1);
};

const cmdRecord = ({
  eventsFile,
  repetition,
  runId,
  scenarioId,
  turn,
}: {
  eventsFile: string;
  repetition: number;
  runId: string;
  scenarioId: string;
  turn: number;
}) => {
  assertScenarioIds({ ids: [scenarioId] });
  const events = JSON.parse(readFileSync(eventsFile, "utf-8")) as EvalEvent[];
  const result = hostSessionRecord({
    events,
    repetition,
    runId,
    scenarioId,
    turn,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
};

const cmdFinalize = ({
  modelId,
  runId,
}: {
  modelId?: string;
  runId: string;
}) => {
  const result = hostSessionFinalize({ modelId, runId });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  if (result.grades.some((g) => g.gate === "fail" || !g.officialEligible))
    process.exit(1);
};

const cmdPilotLoop = async ({
  dryRun,
  repetition,
}: {
  dryRun: boolean;
  repetition: number;
}) => {
  const ts = Date.now();
  const runId = `pilot-loop-${ts}`;
  if (dryRun) {
    const flowScenarios = ["S13", "S16", "S17", "S09", "S01"];
    const controlScenarios = ["S13", "S16", "S09"];
    await awaitBatch({
      arm: "flow",
      official: false,
      repetition,
      runId: `${runId}-flow`,
      scenarioIds: flowScenarios,
    });
    await awaitBatch({
      arm: "control",
      official: false,
      repetition,
      runId: `${runId}-control`,
      scenarioIds: controlScenarios,
    });
    writeRemediationProposal({
      runId,
      findings: [
        {
          id: "F-pilot-complete",
          status: "dry-run",
          summary:
            "Dry-run recorded stakeholder turns only; not evidence of agent compliance.",
        },
      ],
    });
    console.log(`Pilot loop dry-run recorded: ${runId}`);
    return;
  }

  const flowScenarios = ["S13", "S16", "S17", "S09", "S01"];
  const controlScenarios = ["S13", "S16", "S09"];
  const flowPrep = prepareHostRun({
    arm: "flow",
    repetition,
    runId: `${runId}-flow`,
    scenarioIds: flowScenarios,
  });
  const controlPrep = prepareHostRun({
    arm: "control",
    repetition,
    runId: `${runId}-control`,
    scenarioIds: controlScenarios,
  });
  writeRemediationProposal({
    runId,
    findings: [
      {
        id: "F-pilot-complete",
        status: "pending-review",
        summary:
          "Host-session pilot prepared; complete each run via /flow-eval before compare.",
      },
    ],
  });
  console.log(
    JSON.stringify(
      {
        controlRunId: controlPrep.runId,
        flowRunId: flowPrep.runId,
        message:
          "Prepared only. Complete each run via /flow-eval, then compare with eval compare.",
        runId,
        status: "awaiting-host",
      },
      null,
      2
    )
  );
  process.exit(2);
};

const cmdPilot = ({ scenarios }: { scenarios: string[] }) => {
  const prep = prepareHostRun({
    arm: "flow",
    scenarioIds: scenarios,
  });
  printAwaitingHost({ host: prep.host, runId: prep.runId });
  process.exit(2);
};

const cmdRun = async ({
  scenarios,
  arm,
  dryRun,
  repetition,
  randomizationSeed,
}: {
  scenarios: string[];
  arm: EvalArm;
  dryRun: boolean;
  repetition?: number;
  randomizationSeed?: string;
}) => {
  assertScenarioIds({ ids: scenarios });
  assertArm({ arm });
  const runId = `run-${Date.now()}`;
  if (randomizationSeed) {
    mkdirSync(path.join(devEvalsRoot, runId), { recursive: true });
    writeFileSync(
      path.join(devEvalsRoot, runId, "randomization.json"),
      `${JSON.stringify({ seed: randomizationSeed, scenarioIds: scenarios, strategy: "methodology-stratified" }, null, 2)}\n`
    );
  }
  if (dryRun) {
    const { errors, grades, infrastructureFailure, manifest } =
      await awaitBatch({
        arm,
        official: false,
        repetition: repetition ?? 1,
        runId,
        scenarioIds: scenarios,
      });
    if (errors.length) {
      console.error(errors.join("\n"));
      process.exit(infrastructureFailure ? 4 : 1);
    }
    console.log(`Run ${runId} arm=${manifest.arm} harness=${manifest.harness}`);
    console.log("Dry-run: not evidence of agent compliance.");
    if (grades.some((g) => g.gate === "fail" || !g.officialEligible))
      process.exit(1);
    return;
  }

  const prep = prepareHostRun({
    arm,
    repetition: repetition ?? 1,
    runId,
    scenarioIds: scenarios,
  });
  printAwaitingHost({ host: prep.host, runId: prep.runId });
  process.exit(2);
};

const cmdCompare = ({
  baseline,
  current,
  remediationMode,
}: {
  baseline: string;
  current: string;
  remediationMode?: boolean;
}) => {
  const result = compareRuns({
    baselineDir: path.join(devEvalsRoot, baseline),
    currentDir: path.join(devEvalsRoot, current),
    remediationMode,
  });
  console.log(JSON.stringify(result, null, 2));
  if (result.verdict === "inconclusive") process.exit(1);
};

const cmdHandoff = async ({
  variant,
  dryRun,
}: {
  variant: "C1" | "C2" | "C3";
  dryRun: boolean;
}) => {
  if (!["C1", "C2", "C3"].includes(variant)) {
    console.error(`Invalid handoff variant: ${variant}`);
    process.exit(3);
  }
  const runId = `handoff-${variant}-${Date.now()}`;
  const agentAScenario = variant === "C2" ? "S13" : "S01";
  if (dryRun) {
    await awaitBatch({
      arm: "flow",
      official: false,
      runId,
      scenarioIds: [agentAScenario],
    });
    console.log(`Handoff dry-run recorded: ${runId}`);
    return;
  }

  const prep = prepareHostRun({
    arm: "flow",
    runId,
    scenarioIds: [agentAScenario],
  });
  const bPrompt = handoffAgentBPrompt({ variant });
  writeFileSync(
    path.join(devEvalsRoot, runId, "handoff-agent-b-prompt.txt"),
    `${bPrompt}\n`
  );
  writeFileSync(
    path.join(devEvalsRoot, runId, "handoff-notes.json"),
    `${JSON.stringify(
      {
        agentAScenario,
        agentBScenario: "S07",
        agentBPromptPath: "handoff-agent-b-prompt.txt",
        afterAgentA:
          "Finalize agent A scenario, then prepare S07 in same worktree with custom turn-one from handoff-agent-b-prompt.txt",
      },
      null,
      2
    )}\n`
  );
  printAwaitingHost({ host: prep.host, runId: prep.runId });
  process.exit(2);
};

const cmdCompareArms = async ({
  dryRun,
  scenarios,
}: {
  dryRun: boolean;
  scenarios: string[];
}) => {
  assertScenarioIds({ ids: scenarios });
  const ts = Date.now();
  const flowRun = `compare-flow-${ts}`;
  const controlRun = `compare-control-${ts}`;
  if (dryRun) {
    const flowBatch = await awaitBatch({
      arm: "flow",
      official: false,
      runId: flowRun,
      scenarioIds: scenarios,
    });
    if (flowBatch.errors.length) {
      console.error(flowBatch.errors.join("\n"));
      process.exit(flowBatch.infrastructureFailure ? 4 : 1);
    }
    const controlBatch = await awaitBatch({
      arm: "control",
      official: false,
      runId: controlRun,
      scenarioIds: scenarios,
    });
    if (controlBatch.errors.length) {
      console.error(controlBatch.errors.join("\n"));
      process.exit(controlBatch.infrastructureFailure ? 4 : 1);
    }
    const result = compareRuns({
      baselineDir: path.join(devEvalsRoot, controlRun),
      crossArm: true,
      currentDir: path.join(devEvalsRoot, flowRun),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const flowPrep = prepareHostRun({
    arm: "flow",
    runId: flowRun,
    scenarioIds: scenarios,
  });
  const controlPrep = prepareHostRun({
    arm: "control",
    runId: controlRun,
    scenarioIds: scenarios,
  });
  console.log(
    JSON.stringify(
      {
        controlRunId: controlPrep.runId,
        flowRunId: flowPrep.runId,
        message:
          "Prepared only. Complete both runs via /flow-eval, then eval compare --baseline <control> --current <flow>.",
        status: "awaiting-host",
      },
      null,
      2
    )
  );
  process.exit(2);
};

const scenarioList = (value: string | undefined, fallback: string) =>
  String(value ?? fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const resolveRunScenarios = ({
  count,
  explicit,
  seed,
}: {
  count: number;
  explicit?: string;
  seed?: string;
}) => {
  if (explicit)
    return {
      scenarios: scenarioList(explicit, ""),
      seed: undefined,
    };
  const resolvedSeed = seed ?? randomSeed();
  const rng = createSeededRng({ seed: resolvedSeed });
  return {
    scenarios: stratifiedMethodologySample({ count, rng }),
    seed: resolvedSeed,
  };
};

const cmdExperiment = async ({
  count,
  dryRun,
  profile,
  seed,
}: {
  count: number;
  dryRun: boolean;
  profile: "full-product" | "mixed" | "technical-ai-assessment";
  seed?: string;
}) => {
  const result = await runExperiment({
    arm: "flow",
    count,
    dryRun,
    profile,
    seed,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
};

const dispatchGradeCli = (flags: Record<string, unknown>) => {
  if (!flags.run || !flags.scenario) {
    console.error("grade requires --run and --scenario");
    process.exit(3);
  }
  cmdGrade({
    runId: String(flags.run),
    scenarioId: String(flags.scenario),
  });
};

const dispatchCompareCli = (flags: Record<string, unknown>) => {
  if (!flags.baseline || !flags.current) {
    console.error("compare requires --baseline and --current");
    process.exit(3);
  }
  cmdCompare({
    baseline: String(flags.baseline),
    current: String(flags.current),
    remediationMode: Boolean(flags.remediation),
  });
};

const cmdReadiness = ({ runId }: { runId: string }) => {
  const readiness = evaluateReadiness({ runId });
  const findings = findingsFromReadiness(readiness);
  writeProductEvalArtifacts({ findings, readiness, runId });
  console.log(JSON.stringify(readiness, null, 2));
  if (readiness.releaseVerdict !== "READY") process.exit(1);
};

const cmdStress = async ({
  cycles,
  runId,
  workDir,
}: {
  cycles: number;
  runId: string;
  workDir?: string;
}) => {
  const result = await runStressEvaluation({
    maxRemediationCycles: cycles,
    repairExecutor: workDir ? createHostRepairExecutor({ runId }) : undefined,
    runId,
    workDir,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
};

const cmdMutations = () => {
  const result = runMutationIntegrity();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
};

const cmdBenchmark = ({ id }: { id: "benchmark-a" | "benchmark-b" }) => {
  const result = runOfflineBenchmark({ benchmarkId: id });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
};

const dispatchCli = async (command: string, flags: Record<string, unknown>) => {
  const handlers: Record<string, () => Promise<void> | void> = {
    "self-improve": async () => {
      const result = await runSelfImproveCampaign({
        campaignId: flags["campaign-id"]
          ? String(flags["campaign-id"])
          : undefined,
        campaignSeed: flags.seed ? String(flags.seed) : undefined,
        dryRun: Boolean(flags["dry-run"]),
        iterations: Number(flags.iterations ?? 3),
        maxConcurrency: Number(flags["max-concurrency"] ?? 2),
        resume: flags.resume ? String(flags.resume) : undefined,
      });
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exit(1);
    },
    experiment: () =>
      cmdExperiment({
        count: Number(flags.count ?? 1),
        dryRun: Boolean(flags["dry-run"]),
        profile:
          (flags.profile as
            | "full-product"
            | "mixed"
            | "technical-ai-assessment") ?? "full-product",
        seed: flags.seed ? String(flags.seed) : undefined,
      }),
    benchmark: () =>
      cmdBenchmark({
        id: (flags.id as "benchmark-a" | "benchmark-b") ?? "benchmark-a",
      }),
    mutations: () => cmdMutations(),
    readiness: () =>
      cmdReadiness({
        runId: String(flags.run ?? `readiness-${Date.now()}`),
      }),
    stress: () =>
      cmdStress({
        cycles: Number(flags.cycles ?? 3),
        runId: String(flags.run ?? `stress-${Date.now()}`),
        workDir: flags.workdir ? String(flags.workdir) : undefined,
      }),
    compare: () => dispatchCompareCli(flags),
    "compare-arms": () =>
      cmdCompareArms({
        dryRun: Boolean(flags["dry-run"]),
        scenarios: scenarioList(
          flags.scenarios as string | undefined,
          "S05,S09,S13"
        ),
      }),
    finalize: () => {
      if (!flags.run) {
        console.error("finalize requires --run");
        process.exit(3);
      }
      cmdFinalize({
        modelId: flags["model-id"] ? String(flags["model-id"]) : undefined,
        runId: String(flags.run),
      });
    },
    grade: () => dispatchGradeCli(flags),
    handoff: () =>
      cmdHandoff({
        dryRun: Boolean(flags["dry-run"]),
        variant: (flags.variant as "C1" | "C2" | "C3") ?? "C1",
      }),
    briefs: () => {
      if (!flags.run) {
        console.error("briefs requires --run");
        process.exit(3);
      }
      cmdBriefs({ runId: String(flags.run) });
    },
    next: () => {
      if (!flags.run) {
        console.error("next requires --run");
        process.exit(3);
      }
      cmdNext({
        repetition: flags.repetition ? Number(flags.repetition) : undefined,
        runId: String(flags.run),
        scenarioId: flags.scenario ? String(flags.scenario) : undefined,
      });
    },
    pilot: () =>
      cmdPilot({
        scenarios: scenarioList(
          flags.scenarios as string | undefined,
          "S01,S13"
        ),
      }),
    "pilot-loop": () =>
      cmdPilotLoop({
        dryRun: Boolean(flags["dry-run"]),
        repetition: Number(flags.repetition ?? 2),
      }),
    prepare: () =>
      cmdPrepare({
        arm: (flags.arm as EvalArm) ?? "flow",
        repetition: Number(flags.repetition ?? 1),
        runId: flags["run-id"] ? String(flags["run-id"]) : undefined,
        scenarios: flags.suite
          ? listPublicScenarioIds()
          : scenarioList(flags.scenarios as string | undefined, "S01,S13"),
      }),
    preserve: () => cmdPreserve(),
    record: () => {
      if (
        !flags.run ||
        !flags.scenario ||
        !flags.turn ||
        !flags["events-file"]
      ) {
        console.error(
          "record requires --run, --scenario, --turn, and --events-file"
        );
        process.exit(3);
      }
      cmdRecord({
        eventsFile: String(flags["events-file"]),
        repetition: Number(flags.repetition ?? 1),
        runId: String(flags.run),
        scenarioId: String(flags.scenario),
        turn: Number(flags.turn),
      });
    },
    run: () => {
      const resolved = resolveRunScenarios({
        count: Number(flags.count ?? 5),
        explicit: flags.scenarios as string | undefined,
        seed: flags.seed ? String(flags.seed) : undefined,
      });
      return cmdRun({
        arm: (flags.arm as EvalArm) ?? "flow",
        dryRun: Boolean(flags["dry-run"]),
        randomizationSeed: resolved.seed,
        repetition: Number(flags.repetition ?? 1),
        scenarios: resolved.scenarios,
      });
    },
  };
  const handler = handlers[command];
  if (handler) {
    await handler();
    return;
  }
  usage();
  process.exit(1);
};

const main = async () => {
  const flags = parseArgs(process.argv.slice(2));
  const command = flags.command as string;
  if (!command || command === "help") {
    usage();
    return;
  }
  await dispatchCli(command, flags);
};

await main();
