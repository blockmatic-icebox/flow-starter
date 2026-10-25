#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { exit } from "node:process";

import { repoRoot } from "../lib/repo-paths.mjs";

function run({ cmd, args, cwd = repoRoot }) {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (result.error) {
    console.error(result.error.message);
    exit(1);
  }
  if (result.status !== 0) {
    exit(result.status ?? 1);
  }
}

function main() {
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
  const { packageManager } = pkg;
  if (
    typeof packageManager !== "string" ||
    !packageManager.startsWith("pnpm@")
  ) {
    console.error("root package.json is missing a pnpm packageManager field");
    exit(1);
  }
  console.log(`Keeping package manager ${packageManager.split("+")[0]}`);
  run({ args: ["update", "--latest", "--recursive"], cmd: "pnpm" });
  run({
    args: ["update", "--latest"],
    cmd: "pnpm",
    cwd: join(repoRoot, ".deepsec"),
  });
  // Architecture checks still use the classic compiler API (removed from the TS 7 main export).
  run({
    args: ["add", "-D", "-w", "typescript-ast@npm:typescript@5.8.3"],
    cmd: "pnpm",
  });
}

main();
