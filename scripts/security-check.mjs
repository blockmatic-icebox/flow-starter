#!/usr/bin/env node

import { execSync } from "node:child_process";
import { exit } from "node:process";

function runStep({ label, command }) {
  console.log(`${label}...`);
  execSync(command, { stdio: "inherit" });
}

function main() {
  console.log("\nRunning security checks...\n");

  try {
    runStep({
      command: "node scripts/block-secret-files.mjs",
      label: "1. Blocked secret file types (staged)",
    });
    runStep({
      command: "pnpm security:secrets:full",
      label: "2. Full repository secret scan",
    });
    runStep({ command: "pnpm security:osv", label: "3. OSV dependency scan" });
    runStep({ command: "pnpm security:audit", label: "4. pnpm audit (high+)" });
  } catch {
    console.error("\nSecurity checks failed.\n");
    exit(1);
  }

  console.log("\nAll security checks passed.\n");
}

main();
