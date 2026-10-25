#!/usr/bin/env node
/**
 * Build runner observe events from a worker contract (stdin JSON or argv path).
 * Output: JSON array for `eval observe --events-file`.
 */
import { readFileSync } from "node:fs";

const input = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], "utf-8"))
  : JSON.parse(readFileSync(0, "utf-8"));

const { scenarioId = "S00", turn = 1, commands = [], skills = [] } = input;

const events = [];
let seq = 1;

for (const row of commands) {
  events.push({
    command: row.command,
    exitCode: row.exitCode,
    id: `rcmd-${seq}`,
    kind: "command",
    origin: "observed",
    phase: row.exitCode === 0 ? "succeeded" : "failed",
    scenarioId,
    seq,
    turn,
  });
  seq += 1;
}

for (const skillPath of skills) {
  events.push({
    id: `rskill-${seq}`,
    kind: "tool",
    name: "skillLoad",
    origin: "observed",
    path: skillPath,
    scenarioId,
    seq,
    turn,
  });
  seq += 1;
}

process.stdout.write(`${JSON.stringify(events, null, 2)}\n`);
