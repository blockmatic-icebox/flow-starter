#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const evalRoot = path.join(import.meta.dirname, "..");
const agentsRoot = path.join(evalRoot, "..");

const prereq = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "-e",
    "import { integrationPrerequisites } from './src/infrastructure/neon-local.ts'; const r = integrationPrerequisites(); console.log(JSON.stringify(r));",
  ],
  { cwd: evalRoot, encoding: "utf-8" }
);
let integration = { ok: false, reason: "prerequisite check failed" };
try {
  integration = JSON.parse(prereq.stdout.trim().split("\n").at(-1) ?? "{}");
} catch {
  /* keep default */
}

if (!integration.ok) {
  console.log(
    JSON.stringify({
      reason: integration.reason ?? "blocked",
      status: "BLOCKED",
    })
  );
  process.exit(2);
}

const test = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "--test",
    "eval/src/infrastructure/database-parallel.integration.test.ts",
    "eval/src/host-isolation.integration.test.ts",
  ],
  { cwd: agentsRoot, encoding: "utf-8", stdio: "inherit" }
);
process.exit(test.status ?? 1);
