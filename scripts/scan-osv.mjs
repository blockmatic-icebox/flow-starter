#!/usr/bin/env node

import { execSync } from "node:child_process";
import { exit } from "node:process";

function osvScannerInstalled() {
  try {
    execSync("osv-scanner --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function main() {
  if (!osvScannerInstalled()) {
    console.error("\nosv-scanner is not installed. Run: pnpm setup:osv\n");
    exit(1);
  }

  try {
    execSync("osv-scanner scan --lockfile=pnpm-lock.yaml --format=markdown", {
      stdio: "inherit",
    });
    exit(0);
  } catch {
    console.error(
      "\nOSV Scanner found vulnerabilities. Update affected dependencies.\n"
    );
    exit(1);
  }
}

main();
