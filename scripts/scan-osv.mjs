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

  const lockfiles = ["pnpm-lock.yaml", ".deepsec/pnpm-lock.yaml"];
  try {
    for (const lockfile of lockfiles) {
      console.log(`\nScanning ${lockfile}\n`);
      execSync(`osv-scanner scan --lockfile=${lockfile} --format=markdown`, {
        stdio: "inherit",
      });
    }
    exit(0);
  } catch {
    console.error(
      "\nOSV Scanner could not complete or found vulnerabilities. Update affected dependencies or restore registry access.\n"
    );
    exit(1);
  }
}

main();
