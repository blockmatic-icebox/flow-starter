import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { assertAgentAuth } from "./agent.ts";
import { compareRuns } from "./compare.ts";
import { extractCommands } from "./evidence.ts";
import { gradeScenario } from "./grade.ts";
import { handoffAgentBPrompt } from "./handoff.ts";
import { runBatch, runScenarioSession } from "./orchestrate.ts";
import { devEvalsRoot, baselineRunId } from "./paths.ts";
import { verifyBaselinePreserved } from "./preserve.ts";
import {
  loadHiddenScenario,
  loadPublicScenario,
  loadScenarioOracle,
  listPublicScenarioIds,
} from "./scenarios.ts";
import { isBuildAuthorized } from "./stakeholder.ts";
import type { EvalArm, EvalEvent } from "./types.ts";

const usage = () => {
  console.log(`flow-eval CLI

Usage:
  pnpm --filter @repo/flow-eval eval preserve
  pnpm --filter @repo/flow-eval eval grade --run <runId> --scenario <id>
  pnpm --filter @repo/flow-eval eval pilot [--model <id>]
  pnpm --filter @repo/flow-eval eval run --scenarios S01,S02 [--arm flow] [--model <id>] [--dry-run]
  pnpm --filter @repo/flow-eval eval compare --baseline <runId> --current <runId>
  pnpm --filter @repo/flow-eval eval compare-arms [--scenarios S05,S09,S13] [--dry-run]
  pnpm --filter @repo/flow-eval eval handoff --variant C1 [--model <id>] [--dry-run]
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

const loadEvents = ({ filePath }: { filePath: string }) => {
  if (!existsSync(filePath)) return [] as EvalEvent[];
  return readFileSync(filePath, "utf-8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as EvalEvent);
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
  const scenarioDir = path.join(devEvalsRoot, runId, "scenarios", scenarioId);
  const diff = existsSync(path.join(scenarioDir, "diff.patch"))
    ? readFileSync(path.join(scenarioDir, "diff.patch"), "utf-8")
    : "";
  const events = loadEvents({
    filePath: path.join(scenarioDir, "transcript.jsonl"),
  });
  const commandsPath = path.join(scenarioDir, "commands.json");
  const commands = existsSync(commandsPath)
    ? (
        JSON.parse(readFileSync(commandsPath, "utf-8")) as {
          commands: unknown[];
        }
      ).commands
    : extractCommands({ events });
  const card = loadPublicScenario({ id: scenarioId });
  const hidden = loadHiddenScenario({ id: scenarioId });
  const manifestPath = path.join(devEvalsRoot, runId, "manifest.json");
  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf-8"))
    : { harness: "cursor-cli" };
  const grade = gradeScenario({
    input: {
      buildAuthorized: isBuildAuthorized({ events, hidden }),
      card,
      commands: commands as ReturnType<typeof extractCommands>,
      completeness: events.some((e) => e.kind === "result")
        ? "complete"
        : "partial",
      diff,
      events,
      harness: manifest.harness ?? "cursor-cli",
      hidden,
      oracle: loadScenarioOracle({ id: scenarioId }),
      protocolVerified: true,
      scenarioId,
    },
  });
  console.log(JSON.stringify(grade, null, 2));
  if (grade.gate === "fail" || !grade.officialEligible) process.exit(1);
};

const defaultModel = "composer-2.5";

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
  const { errors, grades } = runBatch({
    runId,
    scenarioIds: ["S01", "S13"],
    arm: "flow",
    modelId: model,
    official: true,
  });
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
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
}: {
  scenarios: string[];
  arm: EvalArm;
  model: string;
  dryRun: boolean;
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
  const { errors, grades, manifest } = runBatch({
    runId,
    scenarioIds: scenarios,
    arm,
    modelId: model,
    official,
  });
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
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
}: {
  baseline: string;
  current: string;
}) => {
  const result = compareRuns({
    baselineDir: path.join(devEvalsRoot, baseline),
    currentDir: path.join(devEvalsRoot, current),
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
  runBatch({
    runId: flowRun,
    scenarioIds: scenarios,
    arm: "flow",
    modelId: model,
    official: !dryRun,
  });
  runBatch({
    runId: controlRun,
    scenarioIds: scenarios,
    arm: "control",
    modelId: model,
    official: !dryRun,
  });
  const result = compareRuns({
    baselineDir: path.join(devEvalsRoot, controlRun),
    currentDir: path.join(devEvalsRoot, flowRun),
  });
  writeFileSync(
    path.join(devEvalsRoot, `compare-arms-${ts}.json`),
    `${JSON.stringify({ controlRun, flowRun, ...result }, null, 2)}\n`
  );
  console.log(JSON.stringify(result, null, 2));
  if (!dryRun && result.verdict === "regressed") process.exit(1);
};

const scenarioList = (value: string | undefined, fallback: string) =>
  String(value ?? fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const dispatchCli = (command: string, flags: Record<string, unknown>) => {
  if (command === "preserve") return cmdPreserve();
  if (command === "grade") {
    if (!flags.run || !flags.scenario) {
      console.error("grade requires --run and --scenario");
      process.exit(3);
    }
    return cmdGrade({
      runId: String(flags.run),
      scenarioId: String(flags.scenario),
    });
  }
  if (command === "pilot")
    return cmdPilot({ model: String(flags.model ?? defaultModel) });
  if (command === "run")
    return cmdRun({
      arm: (flags.arm as EvalArm) ?? "flow",
      dryRun: Boolean(flags["dry-run"]),
      model: String(flags.model ?? defaultModel),
      scenarios: scenarioList(
        flags.scenarios as string | undefined,
        "S01,S02,S05,S09,S13"
      ),
    });
  if (command === "compare") {
    if (!flags.baseline || !flags.current) {
      console.error("compare requires --baseline and --current");
      process.exit(3);
    }
    return cmdCompare({
      baseline: String(flags.baseline),
      current: String(flags.current),
    });
  }
  if (command === "compare-arms")
    return cmdCompareArms({
      dryRun: Boolean(flags["dry-run"]),
      model: String(flags.model ?? defaultModel),
      scenarios: scenarioList(
        flags.scenarios as string | undefined,
        "S05,S09,S13"
      ),
    });
  if (command === "handoff")
    return cmdHandoff({
      dryRun: Boolean(flags["dry-run"]),
      model: String(flags.model ?? defaultModel),
      variant: (flags.variant as "C1" | "C2" | "C3") ?? "C1",
    });
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
