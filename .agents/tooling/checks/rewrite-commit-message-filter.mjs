#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { LEGACY_COMMIT_SUBJECT_REWRITES } from "./commit-subject-rewrites.mjs";
import {
  isConventionalCommitSubject,
  parseCommitSubject,
} from "./conventional-commit.mjs";

const input = readFileSync(0, "utf-8");
const lines = input.split(/\r?\n/u);
const subject = parseCommitSubject(input);

if (isConventionalCommitSubject(subject)) {
  process.stdout.write(input);
  process.exit(0);
}

const rewritten = LEGACY_COMMIT_SUBJECT_REWRITES.get(subject);
if (!rewritten) {
  console.error(`No rewrite for non-conventional subject: ${subject}`);
  process.exit(1);
}

lines[0] = rewritten;
process.stdout.write(lines.join("\n"));
