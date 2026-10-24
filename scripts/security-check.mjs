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
      command: "node --test tests/security/secret-scanner-smoke.test.mjs",
      label: "1. Secret scanner self-test",
    });
    runStep({
      command: "node scripts/block-secret-files.mjs",
      label: "2. Blocked secret file types (staged)",
    });
    runStep({
      command: "pnpm security:secrets:full",
      label: "3. Full repository secret scan",
    });
    runStep({ command: "pnpm security:osv", label: "4. OSV dependency scan" });
    runStep({ command: "pnpm security:audit", label: "5. pnpm audit (high+)" });
  } catch {
    console.error("\nSecurity checks failed.\n");
    exit(1);
  }

  console.log("\nAll security checks passed.\n");
}

main();
