#!/usr/bin/env node

import { execSync } from "node:child_process";
import { exit } from "node:process";

function gitleaksInstalled() {
  try {
    execSync("gitleaks version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function main() {
  if (!gitleaksInstalled()) {
    console.error("\ngitleaks is not installed. Run: pnpm setup:gitleaks\n");
    exit(1);
  }

  try {
    execSync(
      "gitleaks protect --staged --redact --verbose --config .gitleaks.toml",
      { stdio: "inherit" }
    );
    exit(0);
  } catch {
    console.error(
      "\nSecret scan failed. Remove secrets from staged files before committing.\n"
    );
    exit(1);
  }
}

main();
