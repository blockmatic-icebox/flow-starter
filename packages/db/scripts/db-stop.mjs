#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { exit } from "node:process";

const repoRoot = path.join(import.meta.dirname, "..", "..", "..");

function main() {
  const result = spawnSync("docker", ["compose", "down"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  exit(result.status ?? 0);
}

main();
