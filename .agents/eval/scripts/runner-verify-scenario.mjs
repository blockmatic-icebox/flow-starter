#!/usr/bin/env node
/**
 * Runner re-verifies product checks for code scenarios (S13/S16).
 * Prints JSON events array for eval observe.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const [worktreePath, scenarioId, turn = "1"] = process.argv.slice(2);
if (!worktreePath || !scenarioId) {
  console.error(
    "usage: runner-verify-scenario.mjs <worktreePath> <scenarioId> [turn]"
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
const events = [];
let seq = 1;

for (const command of cmds) {
  const result = spawnSync(command, {
    cwd,
    encoding: "utf-8",
    shell: true,
  });
  events.push({
    command,
    exitCode: result.status ?? 1,
    id: `verify-${seq}`,
    kind: "command",
    origin: "observed",
    phase: result.status === 0 ? "succeeded" : "failed",
    scenarioId,
    seq,
    turn: Number(turn),
  });
  seq += 1;
}

process.stdout.write(`${JSON.stringify(events, null, 2)}\n`);
