import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { repoRoot } from "../lib/repo-paths.mjs";
import { isParentOwnedWrite } from "../worktrees/constants.mjs";
import { runGit } from "../worktrees/git.mjs";
import { loadAndValidateInitiative } from "../worktrees/initiative.mjs";
import { findOutOfScopePaths } from "../worktrees/ownership.mjs";

const redactForLog = (text) =>
  text
    .replaceAll(/Bearer\s+\S+/giu, "Bearer [REDACTED]")
    .replaceAll(
      /\b[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*\s*=\s*\S+/giu,
      (m) => `${m.split("=")[0]}=[REDACTED]`
    );

const appendPromptEntry = ({ filePath, prompt, summary, timestamp }) => {
  const block = [
    "---",
    timestamp,
    `Prompt: ${redactForLog(prompt)}`,
    `Summary: ${summary}`,
    "",
  ].join("\n");
  const prior = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";
  writeFileSync(filePath, `${prior}${block}`, "utf-8");
};

test("starter prompts.txt is tracked and empty", () => {
  const logPath = join(repoRoot, "prompts.txt");
  assert.ok(existsSync(logPath));
  const content = readFileSync(logPath, "utf-8");
  if (content.length > 0)
    throw new Error(
      "repo prompts.txt must stay empty for the starter baseline; use a temp fixture for examples"
    );
});

test("prompt log append preserves prior entries and redacts secrets", () => {
  const dir = mkdtempSync(join(tmpdir(), "flow-prompt-log-"));
  const logPath = join(dir, "prompts.txt");
  writeFileSync(logPath, "prior-session\n", "utf-8");

  appendPromptEntry({
    filePath: logPath,
    prompt: "Use Bearer sk-live-abc and API_KEY=secret",
    summary: "Explored scope.",
    timestamp: "2026-10-24T12:00:00.000Z",
  });
  appendPromptEntry({
    filePath: logPath,
    prompt: "Continue planning.",
    summary: "Recorded plan decisions.",
    timestamp: "2026-10-24T13:00:00.000Z",
  });

  const out = readFileSync(logPath, "utf-8");
  assert.ok(out.startsWith("prior-session\n"));
  assert.match(out, /2026-10-24T12:00:00\.000Z/u);
  assert.match(out, /Bearer \[REDACTED\]/u);
  assert.match(out, /API_KEY=\[REDACTED\]/u);
  assert.match(out, /2026-10-24T13:00:00\.000Z/u);
  assert.equal(out.split("---").length - 1, 2);

  rmSync(dir, { force: true, recursive: true });
});

test("prompts.txt is parent-owned and rejected on task writes", () => {
  assert.equal(isParentOwnedWrite("prompts.txt"), true);

  const body = `
## Waves

### Wave one

#### task: bad

- mode: build
- flow_stage: Build
- depends_on: []
- writes:
  - prompts.txt
- reads:
  - README.md
- skills:
  - incremental-implementation
- acceptance: true
- build_authorized: yes
`;
  const root = mkdtempSync(join(tmpdir(), "flow-prompt-init-"));
  mkdirSync(join(root, "docs/initiatives"), { recursive: true });
  writeFileSync(join(root, "README.md"), "# t\n", "utf-8");
  writeFileSync(
    join(root, "skills-lock.json"),
    JSON.stringify({
      skills: { "incremental-implementation": {} },
      version: 1,
    }),
    "utf-8"
  );
  writeFileSync(join(root, "docs/initiatives/demo.md"), body, "utf-8");

  const result = loadAndValidateInitiative("demo", root);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some(
      (e) => e.includes("parent-owned") && e.includes("prompts.txt")
    )
  );

  rmSync(root, { force: true, recursive: true });
});

test("worker changes to prompts.txt are out of scope", () => {
  const root = mkdtempSync(join(tmpdir(), "flow-prompt-own-"));
  runGit({ args: ["init", "-b", "main"], cwd: root });
  runGit({ args: ["config", "user.email", "t@t.local"], cwd: root });
  runGit({ args: ["config", "user.name", "t"], cwd: root });
  writeFileSync(join(root, "allowed.txt"), "ok", "utf-8");
  runGit({ args: ["add", "allowed.txt"], cwd: root });
  runGit({ args: ["commit", "-m", "init", "--no-verify"], cwd: root });
  writeFileSync(join(root, "prompts.txt"), "worker wrote\n", "utf-8");

  const outOfScope = findOutOfScopePaths({
    cwd: root,
    writes: ["allowed.txt"],
  });
  assert.ok(outOfScope.includes("prompts.txt"));

  rmSync(root, { force: true, recursive: true });
});
