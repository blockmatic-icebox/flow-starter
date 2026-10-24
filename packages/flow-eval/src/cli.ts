import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { assertAgentAuth } from "./agent.ts";
import { compareRuns } from "./compare.ts";
import { gradeScenario } from "./grade.ts";
import { handoffAgentBPrompt } from "./handoff.ts";
import { runBatch, runScenarioSession } from "./orchestrate.ts";
import { devEvalsRoot, baselineRunId } from "./paths.ts";
import { verifyBaselinePreserved } from "./preserve.ts";
import { loadHiddenScenario, loadPublicScenario } from "./scenarios.ts";
import type { EvalEvent, EvalArm } from "./types.ts";

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
  const flags: Record<string, string | boolean> = { command };
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = rest[i + 1];
      if (!next || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        i += 1;
      }
    }
  }
  return flags;
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
    `Baseline ${baselineRunId} preserved (${result.missingEvidence.length} documented gaps).`
  );
};

const cmdGrade = ({
  runId,
  scenarioId,
}: {
  runId: string;
  scenarioId: string;
}) => {
  const scenarioDir = path.join(devEvalsRoot, runId, "scenarios", scenarioId);
  const diff = existsSync(path.join(scenarioDir, "diff.patch"))
    ? readFileSync(path.join(scenarioDir, "diff.patch"), "utf-8")
    : "";
  const events = loadEvents({
    filePath: path.join(scenarioDir, "transcript.jsonl"),
  });
  const card = loadPublicScenario({ id: scenarioId });
  const hidden = loadHiddenScenario({ id: scenarioId });
  const grade = gradeScenario({
    input: {
      scenarioId,
      card,
      hidden,
      diff,
      events,
      commands: [],
      completeness: events.some((e) => e.kind === "tool")
        ? "complete"
        : "partial",
    },
  });
  console.log(JSON.stringify(grade, null, 2));
  process.exit(grade.gate === "fail" ? 1 : 0);
};

const defaultModel = "composer-2.5";

const cmdPilot = ({ model }: { model: string }) => {
  const runId = `pilot-${Date.now()}`;
  const auth = assertAgentAuth();
  if (!auth.ok) {
    const blocker = {
      runId,
      reason: auth.reason,
      at: new Date().toISOString(),
    };
    writeFileSync(
      path.join(devEvalsRoot, "cli-auth-blocker.json"),
      `${JSON.stringify(blocker, null, 2)}\n`
    );
    console.error(auth.reason);
    process.exit(2);
  }
  const { errors } = runBatch({
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
  const { errors, manifest } = runBatch({
    runId,
    scenarioIds: scenarios,
    arm,
    modelId: model,
    official,
  });
  if (errors.length) console.error(errors.join("\n"));
  console.log(`Run ${runId} arm=${manifest.arm} harness=${manifest.harness}`);
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
  const runId = `handoff-${variant}-${Date.now()}`;
  const official = !dryRun;
  if (official) {
    const auth = assertAgentAuth();
    if (!auth.ok) {
      console.error(auth.reason);
      process.exit(2);
    }
  }

  const agentAResult = runScenarioSession({
    runId,
    scenarioId: "S01",
    arm: "flow",
    modelId: model,
    official,
  });
  if (!agentAResult.ok) {
    console.error(agentAResult.reason);
    process.exit(1);
  }

  const bPrompt = handoffAgentBPrompt({ variant });
  if (official && agentAResult.worktreePath) {
    runScenarioSession({
      runId: `${runId}-agent-b`,
      scenarioId: "S07",
      arm: "flow",
      modelId: model,
      official: true,
    });
  }

  writeFileSync(
    path.join(devEvalsRoot, runId, "handoff-agent-b-prompt.txt"),
    `${bPrompt}\n`
  );
  console.log(`Handoff protocol recorded: ${runId}`);
};

const main = () => {
  const flags = parseArgs(process.argv.slice(2));
  const command = flags.command as string;
  if (!command || command === "help") {
    usage();
    return;
  }

  if (command === "preserve") {
    cmdPreserve();
    return;
  }
  if (command === "grade") {
    cmdGrade({
      runId: String(flags.run),
      scenarioId: String(flags.scenario),
    });
    return;
  }
  if (command === "pilot") {
    cmdPilot({ model: String(flags.model ?? defaultModel) });
    return;
  }
  if (command === "run") {
    const list = String(flags.scenarios ?? "S01,S02,S05,S09,S13").split(",");
    cmdRun({
      scenarios: list,
      arm: (flags.arm as EvalArm) ?? "flow",
      model: String(flags.model ?? defaultModel),
      dryRun: Boolean(flags["dry-run"]),
    });
    return;
  }
  if (command === "compare") {
    cmdCompare({
      baseline: String(flags.baseline),
      current: String(flags.current),
    });
    return;
  }
  if (command === "compare-arms") {
    const list = String(flags.scenarios ?? "S05,S09,S13").split(",");
    const model = String(flags.model ?? defaultModel);
    const dryRun = Boolean(flags["dry-run"]);
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
      scenarioIds: list,
      arm: "flow",
      modelId: model,
      official: !dryRun,
    });
    runBatch({
      runId: controlRun,
      scenarioIds: list,
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
      `${JSON.stringify({ flowRun, controlRun, ...result }, null, 2)}\n`
    );
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "handoff") {
    cmdHandoff({
      variant: (flags.variant as "C1" | "C2" | "C3") ?? "C1",
      model: String(flags.model ?? defaultModel),
      dryRun: Boolean(flags["dry-run"]),
    });
    return;
  }

  usage();
  process.exit(1);
};

main();
