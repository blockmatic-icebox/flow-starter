#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { exit } from "node:process";

import { loadDotenv } from "./load-dotenv.mjs";

const repoRoot = path.join(import.meta.dirname, "..", "..", "..");

function dockerAvailable() {
  const result = spawnSync("docker", ["info"], { stdio: "ignore" });
  return result.status === 0;
}

function main() {
  loadDotenv({ root: repoRoot });

  const missing = ["NEON_API_KEY", "NEON_PROJECT_ID"].filter(
    (key) => !process.env[key]?.trim()
  );
  if (missing.length > 0) {
    console.error(
      `\nMissing ${missing.join(", ")}. Copy .env.defaults.example to .env and set Neon credentials.\n`
    );
    exit(1);
  }

  if (!dockerAvailable()) {
    console.error("\nDocker is not running or not installed.\n");
    exit(1);
  }

  const result = spawnSync("docker", ["compose", "up", "-d", "db"], {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    exit(result.status ?? 1);
  }

  console.log(
    "\nNeon Local is up at postgres://neon:npg@localhost:5432/neondb?sslmode=require\n"
  );
}

main();
