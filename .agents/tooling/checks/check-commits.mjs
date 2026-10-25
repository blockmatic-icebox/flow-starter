#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { exit } from "node:process";
import { pathToFileURL } from "node:url";

import { repoRoot } from "../lib/repo-paths.mjs";
import {
  formatConventionalCommitHelp,
  isConventionalCommitSubject,
} from "./conventional-commit.mjs";

const readSubjects = ({ args, cwd }) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf-8" });
  if (result.status !== 0) {
    console.error(result.stderr || "git log failed");
    return { ok: false, subjects: [] };
  }
  const subjects = result.stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return { ok: true, subjects };
};

export const findNonConventionalSubjects = (subjects) =>
  subjects.filter((subject) => !isConventionalCommitSubject(subject));

export const validateCommitRange = ({ cwd, range }) => {
  const { ok, subjects } = readSubjects({
    args: ["log", "--format=%s", range],
    cwd,
  });
  if (!ok) return { invalid: [], ok: false };

  const invalid = findNonConventionalSubjects(subjects);
  if (invalid.length === 0) return { invalid: [], ok: true };

  return { invalid, ok: false };
};

const parseArgs = (argv) => {
  let range = null;
  let all = false;
  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--all") all = true;
    else if (token === "--range") {
      range = argv[index + 1] ?? null;
      index += 1;
    }
  }
  return { all, range };
};

const main = () => {
  const { all, range } = parseArgs(process.argv);
  const cwd = repoRoot;

  if (!all && !range) {
    console.error(
      "Usage: check-commits.mjs --range <rev>...<rev> | check-commits.mjs --all"
    );
    exit(1);
  }

  const result = all
    ? validateCommitRange({ cwd, range: "HEAD" })
    : validateCommitRange({ cwd, range });
  if (!result.ok && result.invalid.length === 0) exit(1);

  if (result.ok) exit(0);

  console.error("Non-conventional commit subjects:\n");
  for (const subject of result.invalid) console.error(`  - ${subject}`);
  console.error(`\n${formatConventionalCommitHelp()}`);
  exit(1);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
