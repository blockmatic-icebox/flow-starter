#!/usr/bin/env node

import { copyFileSync, existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { exit } from "node:process";

import { repoRoot } from "../lib/repo-paths.mjs";

const skipDirs = new Set(["node_modules", ".git", "dist", ".next", ".turbo"]);
const exampleNamePattern = /^\.env\.([^.]+)\.example$/;

function destName(exampleName) {
  const match = exampleName.match(exampleNamePattern);
  if (!match) {
    return null;
  }
  const qualifier = match[1];
  if (qualifier === "defaults") {
    return ".env";
  }
  return `.env.${qualifier}`;
}

async function findExampleFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) {
        continue;
      }
      files.push(...(await findExampleFiles(path)));
      continue;
    }
    if (entry.isFile() && exampleNamePattern.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

async function main() {
  console.log("\nCopying env templates...\n");

  const examples = (await findExampleFiles(repoRoot)).toSorted();
  let created = 0;
  let skipped = 0;

  for (const examplePath of examples) {
    const dest = destName(basename(examplePath));
    if (!dest) {
      continue;
    }
    const destPath = join(dirname(examplePath), dest);
    const relDest = relative(repoRoot, destPath);

    if (existsSync(destPath)) {
      console.log(`skipped ${relDest} (already exists)`);
      skipped += 1;
      continue;
    }

    copyFileSync(examplePath, destPath);
    console.log(`created ${relDest}`);
    created += 1;
  }

  console.log(
    `\nEnv setup complete (${created} created, ${skipped} skipped)\n`
  );
}

main().catch((error) => {
  console.error(`\nFailed to copy env templates: ${error.message}\n`);
  exit(1);
});
