#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { exit } from "node:process";

const repoRoot = join(import.meta.dirname, "..");
const nestedPackageJson = [".deepsec/package.json"];

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

function writePackageManager({ path, packageManager }) {
  const pkg = JSON.parse(readFileSync(path, "utf-8"));
  if (pkg.packageManager === packageManager) {
    return;
  }
  writeFileSync(
    path,
    `${JSON.stringify({ ...pkg, packageManager }, null, 2)}\n`
  );
}

function main() {
  run({ args: ["use", "pnpm@latest"], cmd: "corepack" });
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8"));
  const { packageManager } = pkg;
  if (
    typeof packageManager !== "string" ||
    !packageManager.startsWith("pnpm@")
  ) {
    console.error("root package.json is missing a pnpm packageManager field");
    exit(1);
  }
  for (const rel of nestedPackageJson) {
    writePackageManager({ packageManager, path: join(repoRoot, rel) });
  }
  run({ args: ["update", "--latest", "--recursive"], cmd: "pnpm" });
  run({
    args: ["update", "--latest"],
    cmd: "pnpm",
    cwd: join(repoRoot, ".deepsec"),
  });
}

main();
