#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { exit } from "node:process";
import { pathToFileURL } from "node:url";

import {
  formatConventionalCommitHelp,
  isConventionalCommitSubject,
  parseCommitSubject,
} from "./conventional-commit.mjs";

export const validateCommitMessageText = (message) => {
  const subject = parseCommitSubject(message);
  if (isConventionalCommitSubject(subject)) return { ok: true, subject };

  return {
    ok: false,
    reason: formatConventionalCommitHelp(),
    subject,
  };
};

const main = () => {
  const messagePath = process.argv.at(2);
  if (!messagePath) {
    console.error("Usage: check-commit-message.mjs <commit-message-file>");
    exit(1);
  }

  const message = readFileSync(messagePath, "utf-8");
  const result = validateCommitMessageText(message);
  if (result.ok) exit(0);

  console.error(`Invalid commit subject: ${result.subject || "(empty)"}\n`);
  console.error(result.reason);
  exit(1);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
