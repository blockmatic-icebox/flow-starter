#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { exit } from "node:process";

const repoRoot = join(import.meta.dirname, "..");

function main() {
  const result = spawnSync("docker", ["compose", "down"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  exit(result.status ?? 0);
}

main();
