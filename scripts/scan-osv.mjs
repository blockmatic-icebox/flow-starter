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

const scanLockfile = ({ lockfile }) => {
  console.log(`\nScanning ${lockfile}\n`);
  execSync(`osv-scanner scan --lockfile=${lockfile} --format=markdown`, {
    stdio: "inherit",
  });
};

function main() {
  if (!osvScannerInstalled()) {
    console.error("\nosv-scanner is not installed. Run: pnpm setup:osv\n");
    exit(1);
  }

  try {
    scanLockfile({ lockfile: "pnpm-lock.yaml" });
  } catch {
    console.error(
      "\nOSV Scanner could not complete or found vulnerabilities in the main workspace. Update affected dependencies or restore registry access.\n"
    );
    exit(1);
  }

  try {
    scanLockfile({ lockfile: ".deepsec/pnpm-lock.yaml" });
  } catch {
    console.warn(
      "\nAdvisory: OSV reported issues in .deepsec/pnpm-lock.yaml (optional deepsec tooling). The main workspace lockfile is clean. Update deepsec when upstream publishes fixes.\n"
    );
  }

  exit(0);
}

main();
