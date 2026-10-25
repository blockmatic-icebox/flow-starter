import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { assertAgentAuth } from "./agent.ts";
import { compareRuns } from "./compare.ts";
import { gradeScenarioFromRunDir } from "./grade-from-run.ts";
import { handoffAgentBPrompt } from "./handoff.ts";
import { runBatch, runScenarioSession } from "./orchestrate.ts";
import { devEvalsRoot, baselineRunId } from "./paths.ts";
import { verifyBaselinePreserved } from "./preserve.ts";
import {
  runMutationIntegrity,
  runOfflineBenchmark,
} from "./product/mutations.ts";
import { writeProductEvalArtifacts } from "./product/persist.ts";
import { evaluateReadiness } from "./product/readiness.ts";
import { runStressEvaluation } from "./product/stress.ts";
import { listPublicScenarioIds } from "./scenarios.ts";
import type { EvalArm } from "./types.ts";

const usage = () => {
  console.log(`flow-eval CLI

Usage:
  pnpm --filter @repo/flow-eval eval preserve
  pnpm --filter @repo/flow-eval eval grade --run <runId> --scenario <id>
  pnpm --filter @repo/flow-eval eval pilot [--model <id>]
  pnpm --filter @repo/flow-eval eval run --scenarios S01,S02 [--arm flow] [--model <id>] [--dry-run]
  pnpm --filter @repo/flow-eval eval compare --baseline <runId> --current <runId> [--remediation]
  pnpm --filter @repo/flow-eval eval pilot-loop [--model <id>] [--dry-run]
  pnpm --filter @repo/flow-eval eval compare-arms [--scenarios S05,S09,S13] [--dry-run]
  pnpm --filter @repo/flow-eval eval handoff --variant C1 [--model <id>] [--dry-run]
  pnpm --filter @repo/flow-eval eval readiness [--run <id>]
  pnpm --filter @repo/flow-eval eval stress [--run <id>] [--cycles N]
  pnpm --filter @repo/flow-eval eval mutations
  pnpm --filter @repo/flow-eval eval benchmark --id benchmark-a|benchmark-b
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
  if (!result.ok) {
    console.error("Baseline integrity check failed:");
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
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

const defaultModel = "composer-2.5";

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

const cmdPilotLoop = ({
  model,
  dryRun,
  repetition,
}: {
  model: string;
  dryRun: boolean;
  repetition: number;
}) => {
  const ts = Date.now();
  const runId = `pilot-loop-${ts}`;
  const official = !dryRun;
  if (official) {
    const auth = assertAgentAuth();
    if (!auth.ok) {
      writeFileSync(
        path.join(devEvalsRoot, "cli-auth-blocker.json"),
        `${JSON.stringify({ runId, reason: auth.reason, at: new Date().toISOString() }, null, 2)}\n`
      );
      writeRemediationProposal({
        runId,
        findings: [
          {
            id: "F-pilot-auth",
            status: "blocked",
            summary:
              "Official pilot requires `agent login` or CURSOR_API_KEY. Re-run `eval pilot-loop` after auth.",
          },
          {
            id: "F-deleg-001",
            status: "addressed-in-code",
            summary:
              "Delegation oracle no longer clears ADR/build-not-authorized gates via applyPolicy (WP1).",
          },
        ],
      });
      console.error(auth.reason);
      process.exit(2);
    }
  }

  const flowScenarios = ["S13", "S16", "S17", "S09", "S01"];
  const controlScenarios = ["S13", "S16", "S09"];
  runBatch({
    arm: "flow",
    modelId: model,
    official,
    repetition,
    runId: `${runId}-flow`,
    scenarioIds: flowScenarios,
  });
  runBatch({
    arm: "control",
    modelId: model,
    official,
    repetition,
    runId: `${runId}-control`,
    scenarioIds: controlScenarios,
  });
  writeRemediationProposal({
    runId,
    findings: [
      {
        id: "F-pilot-complete",
        status: dryRun ? "dry-run" : "pending-review",
        summary: dryRun
          ? "Dry-run recorded stakeholder turns only; not evidence of agent compliance."
          : "Live pilot artifacts under flow/control run ids; human review required before WP3 doc edits.",
      },
    ],
  });
  console.log(`Pilot loop ${dryRun ? "dry-run" : "run"} recorded: ${runId}`);
  if (dryRun) console.log("Dry-run: not evidence of agent compliance.");
};

const cmdPilot = ({ model }: { model: string }) => {
  const runId = `pilot-${Date.now()}`;
  const auth = assertAgentAuth();
  if (!auth.ok) {
    const blocker = {
      at: new Date().toISOString(),
      reason: auth.reason,
      runId,
    };
    writeFileSync(
      path.join(devEvalsRoot, "cli-auth-blocker.json"),
      `${JSON.stringify(blocker, null, 2)}\n`
    );
    console.error(auth.reason);
    process.exit(2);
  }
  const { errors, grades, infrastructureFailure } = runBatch({
    runId,
    scenarioIds: ["S01", "S13"],
    arm: "flow",
    modelId: model,
    official: true,
  });
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(infrastructureFailure ? 4 : 1);
  }
  if (grades.some((g) => g.gate === "fail" || !g.officialEligible))
    process.exit(1);
  console.log(`Pilot complete: ${runId}`);
};

const cmdRun = ({
  scenarios,
  arm,
  model,
  dryRun,
  repetition,
}: {
  scenarios: string[];
  arm: EvalArm;
  model: string;
  dryRun: boolean;
  repetition?: number;
}) => {
  assertScenarioIds({ ids: scenarios });
  assertArm({ arm });
  const runId = `run-${Date.now()}`;
  const official = !dryRun;
  if (official) {
    const auth = assertAgentAuth();
    if (!auth.ok) {
      writeFileSync(
        path.join(devEvalsRoot, "cli-auth-blocker.json"),
        `${JSON.stringify({ runId, reason: auth.reason }, null, 2)}\n`
      );
      console.error(auth.reason);
      process.exit(2);
    }
  }
  const { errors, grades, infrastructureFailure, manifest } = runBatch({
    runId,
    scenarioIds: scenarios,
    arm,
    modelId: model,
    official,
    repetition: repetition ?? 1,
  });
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(infrastructureFailure ? 4 : 1);
  }
  console.log(`Run ${runId} arm=${manifest.arm} harness=${manifest.harness}`);
  if (dryRun) {
    console.log("Dry-run: not evidence of agent compliance.");
    return;
  }
  if (grades.some((g) => g.gate === "fail" || !g.officialEligible))
    process.exit(1);
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

const cmdHandoff = ({
  variant,
  model,
  dryRun,
}: {
  variant: "C1" | "C2" | "C3";
  model: string;
  dryRun: boolean;
}) => {
  if (!["C1", "C2", "C3"].includes(variant)) {
    console.error(`Invalid handoff variant: ${variant}`);
    process.exit(3);
  }
  const runId = `handoff-${variant}-${Date.now()}`;
  const official = !dryRun;
  if (official) {
    const auth = assertAgentAuth();
    if (!auth.ok) {
      console.error(auth.reason);
      process.exit(2);
    }
  }

  const agentAScenario = variant === "C2" ? "S13" : "S01";
  const agentAResult = runScenarioSession({
    arm: "flow",
    modelId: model,
    official,
    runId,
    scenarioId: agentAScenario,
  });
  if (!agentAResult.ok) {
    console.error(agentAResult.reason);
    process.exit(1);
  }

  const bPrompt = handoffAgentBPrompt({ variant });
  writeFileSync(
    path.join(devEvalsRoot, runId, "handoff-agent-b-prompt.txt"),
    `${bPrompt}\n`
  );

  if (official && agentAResult.worktreePath && agentAResult.prepBaselineSha) {
    const agentB = runScenarioSession({
      arm: "flow",
      customTurnOnePrompt: bPrompt,
      maxTurns: 4,
      modelId: model,
      official: true,
      prepBaselineSha: agentAResult.prepBaselineSha,
      runId,
      scenarioId: "S07",
      worktreePath: agentAResult.worktreePath,
    });
    if (!agentB.ok || agentB.grade?.gate === "fail") process.exit(1);
  }

  console.log(`Handoff protocol recorded: ${runId}`);
};

const cmdCompareArms = ({
  dryRun,
  model,
  scenarios,
}: {
  dryRun: boolean;
  model: string;
  scenarios: string[];
}) => {
  assertScenarioIds({ ids: scenarios });
  const ts = Date.now();
  const flowRun = `compare-flow-${ts}`;
  const controlRun = `compare-control-${ts}`;
  if (!dryRun) {
    const auth = assertAgentAuth();
    if (!auth.ok) {
      console.error(auth.reason);
      process.exit(2);
    }
  }
  const flowBatch = runBatch({
    runId: flowRun,
    scenarioIds: scenarios,
    arm: "flow",
    modelId: model,
    official: !dryRun,
  });
  if (flowBatch.errors.length) {
    console.error(flowBatch.errors.join("\n"));
    process.exit(flowBatch.infrastructureFailure ? 4 : 1);
  }
  const controlBatch = runBatch({
    runId: controlRun,
    scenarioIds: scenarios,
    arm: "control",
    modelId: model,
    official: !dryRun,
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
  writeFileSync(
    path.join(devEvalsRoot, `compare-arms-${ts}.json`),
    `${JSON.stringify({ controlRun, flowRun, ...result }, null, 2)}\n`
  );
  console.log(JSON.stringify(result, null, 2));
  if (
    !dryRun &&
    (result.verdict === "regressed" || result.verdict === "inconclusive")
  )
    process.exit(1);
};

const scenarioList = (value: string | undefined, fallback: string) =>
  String(value ?? fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
  writeProductEvalArtifacts({ readiness, runId });
  console.log(JSON.stringify(readiness, null, 2));
  if (readiness.releaseVerdict !== "READY") process.exit(1);
};

const cmdStress = ({ runId, cycles }: { runId: string; cycles: number }) => {
  const result = runStressEvaluation({
    maxRemediationCycles: cycles,
    runId,
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

const dispatchCli = (command: string, flags: Record<string, unknown>) => {
  const handlers: Record<string, () => void> = {
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
      }),
    compare: () => dispatchCompareCli(flags),
    "compare-arms": () =>
      cmdCompareArms({
        dryRun: Boolean(flags["dry-run"]),
        model: String(flags.model ?? defaultModel),
        scenarios: scenarioList(
          flags.scenarios as string | undefined,
          "S05,S09,S13"
        ),
      }),
    grade: () => dispatchGradeCli(flags),
    handoff: () =>
      cmdHandoff({
        dryRun: Boolean(flags["dry-run"]),
        model: String(flags.model ?? defaultModel),
        variant: (flags.variant as "C1" | "C2" | "C3") ?? "C1",
      }),
    pilot: () => cmdPilot({ model: String(flags.model ?? defaultModel) }),
    "pilot-loop": () =>
      cmdPilotLoop({
        dryRun: Boolean(flags["dry-run"]),
        model: String(flags.model ?? defaultModel),
        repetition: Number(flags.repetition ?? 2),
      }),
    preserve: () => cmdPreserve(),
    run: () =>
      cmdRun({
        arm: (flags.arm as EvalArm) ?? "flow",
        dryRun: Boolean(flags["dry-run"]),
        model: String(flags.model ?? defaultModel),
        repetition: Number(flags.repetition ?? 1),
        scenarios: scenarioList(
          flags.scenarios as string | undefined,
          "S01,S02,S05,S09,S13"
        ),
      }),
  };
  const handler = handlers[command];
  if (handler) {
    handler();
    return;
  }
  usage();
  process.exit(1);
};

const main = () => {
  const flags = parseArgs(process.argv.slice(2));
  const command = flags.command as string;
  if (!command || command === "help") {
    usage();
    return;
  }
  dispatchCli(command, flags);
};

main();
