#!/usr/bin/env node
import { spawnSync } from "node:child_process";
/**
 * Runner re-verifies product checks for code scenarios (S13/S16).
 * With --scenario-dir, writes trusted runner-capture bundle for eval observe.
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const scenarioDirFlag = args.indexOf("--scenario-dir");
const scenarioDir =
  scenarioDirFlag === -1 ? undefined : args[scenarioDirFlag + 1];
const positional = args.filter(
  (a, i) => a !== "--scenario-dir" && i !== scenarioDirFlag + 1
);

const [worktreePath, scenarioId, turn = "1"] = positional;
if (!worktreePath || !scenarioId) {
  console.error(
    "usage: runner-verify-scenario.mjs <worktreePath> <scenarioId> [turn] [--scenario-dir <evalScenarioDir>]"
  );
  process.exit(2);
}

const commandsByScenario = {
  S13: ["pnpm exec node --import tsx --test src/listings-sort.test.ts"],
  S16: ["pnpm exec node --import tsx --test src/listings-sort.test.ts"],
};

const cmds = commandsByScenario[scenarioId];
if (!cmds) {
  process.stdout.write("[]\n");
  process.exit(0);
}

const cwd = path.join(worktreePath, "packages/genui");
const invocationId = randomUUID();
const events = [];
let seq = 1;

for (const command of cmds) {
  const result = spawnSync(command, {
    cwd,
    encoding: "utf-8",
    shell: true,
  });
  events.push({
    captureMethod: "runner-subprocess",
    command,
    exitCode: result.status ?? 1,
    id: `verify-${invocationId}-${seq}`,
    invocationId,
    kind: "command",
    origin: "observed",
    phase: result.status === 0 ? "succeeded" : "failed",
    scenarioId,
    seq,
    ts: new Date().toISOString(),
    turn: Number(turn),
  });
  seq += 1;
}

if (scenarioDir) {
  const captureRoot = path.join(scenarioDir, "runner-capture");
  mkdirSync(captureRoot, { recursive: true });
  const eventsPath = path.join(captureRoot, "events.json");
  writeFileSync(eventsPath, `${JSON.stringify(events, null, 2)}\n`);
  const manifest = {
    captureMethod: "runner-subprocess",
    commandHash: createHash("sha256")
      .update(cmds.join("\n"))
      .digest("hex")
      .slice(0, 16),
    eventsFile: eventsPath,
    invocationId,
    recordedAt: new Date().toISOString(),
    sandbox: "none",
    scenarioId,
    turn: Number(turn),
  };
  writeFileSync(
    path.join(captureRoot, "capture-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  process.stdout.write(
    `${JSON.stringify({ events, eventsPath, manifest }, null, 2)}\n`
  );
} else process.stdout.write(`${JSON.stringify(events, null, 2)}\n`);
