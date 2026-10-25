#!/usr/bin/env node
/**
 * Diagnostic-only: builds observed-shaped events from worker-reported rows.
 * NOT valid for eval observe (use runner-invoke.mjs or runner-verify-scenario.mjs).
 */
import { readFileSync } from "node:fs";

if (!process.argv.includes("--diagnostic")) {
  console.error(
    "Refusing to emit observed events without --diagnostic. Use runner-invoke.mjs for trusted capture."
  );
  process.exit(2);
}

const [fileArg] = process.argv.slice(2);
const input =
  fileArg && !fileArg.startsWith("-")
    ? JSON.parse(readFileSync(fileArg, "utf-8"))
    : JSON.parse(readFileSync(0, "utf-8"));

const { scenarioId = "S00", turn = 1, commands = [], skills = [] } = input;

const events = [];
let seq = 1;

for (const row of commands) {
  events.push({
    command: row.command,
    exitCode: row.exitCode,
    id: `diag-cmd-${seq}`,
    kind: "command",
    origin: "agent-reported",
    phase: row.exitCode === 0 ? "succeeded" : "failed",
    scenarioId,
    seq,
    turn,
  });
  seq += 1;
}

for (const skillPath of skills) {
  events.push({
    id: `diag-skill-${seq}`,
    kind: "tool",
    name: "skillLoad",
    origin: "agent-reported",
    path: skillPath,
    scenarioId,
    seq,
    turn,
  });
  seq += 1;
}

process.stdout.write(`${JSON.stringify(events, null, 2)}\n`);
