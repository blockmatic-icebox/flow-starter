#!/usr/bin/env node
import { spawnSync } from "node:child_process";
/**
 * Trusted runner capture: executes commands and writes runner-capture bundle.
 * Usage: runner-invoke.mjs <scenarioDir> <runId> <scenarioId> <turn> <command...>
 * Or stdin JSON: { scenarioDir, runId, scenarioId, turn, commands: string[] }
 */
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { spawnEnvForCwd } from "./runner-subject-env.mjs";

const CAPTURE_DIR = "runner-capture";
const EVENTS_FILE = "events.json";
const MANIFEST_FILE = "capture-manifest.json";

const writeBundle = ({
  scenarioDir,
  runId,
  scenarioId,
  turn,
  commands,
  cwd,
}) => {
  const captureRoot = path.join(scenarioDir, CAPTURE_DIR);
  mkdirSync(captureRoot, { recursive: true });
  const invocationId = randomUUID();
  const events = [];
  let seq = 1;

  for (const command of commands) {
    const startedAt = new Date().toISOString();
    const result = spawnSync(command, {
      cwd,
      encoding: "utf-8",
      env: spawnEnvForCwd({ cwd }),
      maxBuffer: 10 * 1024 * 1024,
      shell: true,
    });
    const exitCode = result.status ?? 1;
    const logPath = path.join(captureRoot, `cmd-${seq}.log`);
    writeFileSync(
      logPath,
      `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(0, 500_000)
    );
    events.push({
      captureMethod: "runner-subprocess",
      command,
      exitCode,
      id: `rcmd-${invocationId}-${seq}`,
      invocationId,
      kind: "command",
      logPath: path.relative(scenarioDir, logPath),
      origin: "observed",
      phase: exitCode === 0 ? "succeeded" : "failed",
      scenarioId,
      seq,
      startedAt,
      ts: new Date().toISOString(),
      turn,
    });
    seq += 1;
  }

  const eventsPath = path.join(captureRoot, EVENTS_FILE);
  writeFileSync(eventsPath, `${JSON.stringify(events, null, 2)}\n`);
  const manifest = {
    captureMethod: "runner-subprocess",
    commandHash: createHash("sha256")
      .update(commands.join("\n"))
      .digest("hex")
      .slice(0, 16),
    eventsFile: eventsPath,
    invocationId,
    recordedAt: new Date().toISOString(),
    runId,
    sandbox: "none",
    scenarioId,
    turn,
  };
  writeFileSync(
    path.join(captureRoot, MANIFEST_FILE),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  process.stdout.write(
    `${JSON.stringify({ events, eventsPath, manifest }, null, 2)}\n`
  );
};

const argv = process.argv.slice(2);
if (argv[0] === "--stdin") {
  const input = JSON.parse(readFileSync(0, "utf-8"));
  writeBundle({
    commands: input.commands ?? [],
    cwd: input.cwd,
    runId: input.runId,
    scenarioDir: input.scenarioDir,
    scenarioId: input.scenarioId,
    turn: input.turn,
  });
} else if (argv.length >= 5) {
  const [scenarioDir, runId, scenarioId, turn, ...commands] = argv;
  const cwd = argv.includes("--cwd")
    ? argv[argv.indexOf("--cwd") + 1]
    : undefined;
  writeBundle({
    commands,
    cwd,
    runId,
    scenarioDir,
    scenarioId,
    turn: Number(turn),
  });
} else {
  console.error(
    "usage: runner-invoke.mjs <scenarioDir> <runId> <scenarioId> <turn> <command...>"
  );
  process.exit(2);
}
