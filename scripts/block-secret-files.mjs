#!/usr/bin/env node

import { execSync } from "node:child_process";
import { exit } from "node:process";

const blockedPatterns = [
  /^\.env$/,
  /^\.env\./,
  /\.env$/,
  /\.pem$/,
  /\.key$/,
  /^id_rsa/,
  /id_rsa$/,
  /\.p12$/,
  /\.pfx$/,
  /\.jks$/,
  /\.keystore$/,
  /\.crt$/,
  /\.cer$/,
  /\.der$/,
  /\.p7b$/,
  /\.p7c$/,
  /\.p7m$/,
  /\.p7s$/,
  /\.keytab$/,
];

const allowedPatterns = [
  /\.env\.[^/]+\.example$/,
  /\.env\.schema$/,
  /\.env\.development$/,
  /\.env\.staging$/,
  /\.env\.production$/,
  /\.env\.test$/,
];

export function isBlocked(filename) {
  for (const allowed of allowedPatterns) {
    if (allowed.test(filename)) {
      return false;
    }
  }

  for (const blocked of blockedPatterns) {
    if (blocked.test(filename)) {
      return true;
    }
  }

  return false;
}

function getStagedFiles() {
  const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function main() {
  const blockedFiles = getStagedFiles().filter(isBlocked);

  if (blockedFiles.length === 0) {
    exit(0);
  }

  console.error(
    "\nSecurity check failed: attempting to commit sensitive files\n"
  );
  for (const file of blockedFiles) {
    console.error(`  - ${file}`);
  }
  console.error(
    "\nUse .env.<qualifier>.example templates instead of committing secrets.\n"
  );
  exit(1);
}

if (process.argv[1] === import.meta.filename) {
  main();
}
