import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import { runGit, revParse } from "./git.mjs";
import { loadAndValidateInitiative } from "./initiative.mjs";
import { prepareReadyTasks, safeCleanupTask } from "./lifecycle.mjs";
import { runInitiative, runSequentialForTests } from "./run.mjs";
import { loadState } from "./state.mjs";

const initGitRepo = (root) => {
  runGit({ args: ["init", "-b", "main"], cwd: root });
  runGit({ args: ["config", "user.email", "flow@test.local"], cwd: root });
  runGit({ args: ["config", "user.name", "flow-test"], cwd: root });
  writeFileSync(path.join(root, "README.md"), "# test\n", "utf-8");
  runGit({ args: ["add", "README.md"], cwd: root });
  runGit({ args: ["commit", "-m", "init", "--no-verify"], cwd: root });
};

const writeSkillsLock = (root) => {
  writeFileSync(
    path.join(root, "skills-lock.json"),
    JSON.stringify({
      skills: { "incremental-implementation": {} },
      version: 1,
    }),
    "utf-8"
  );
};

const twoParallelInitiative = `
## Waves

### Wave one

#### task: a

- mode: build
- flow_stage: Build
- depends_on: []
- writes:
  - pkg/a.txt
- reads:
  - README.md
- skills:
  - incremental-implementation
- acceptance: test -f pkg/a.txt
- build_authorized: yes

#### task: b

- mode: build
- flow_stage: Build
- depends_on: []
- writes:
  - pkg/b.txt
- reads:
  - README.md
- skills:
  - incremental-implementation
- acceptance: test -f pkg/b.txt
- build_authorized: yes

### Wave two

#### task: c

- mode: build
- flow_stage: Build
- depends_on:
  - a
  - b
- writes:
  - pkg/c.txt
- reads:
  - README.md
- skills:
  - incremental-implementation
- acceptance: test -f pkg/c.txt
- build_authorized: yes
`;

function repoWithInitiative(body) {
  const root = mkdtempSync(path.join(os.tmpdir(), "flow-wt-life-"));
  initGitRepo(root);
  writeSkillsLock(root);
  mkdirSync(path.join(root, "docs/initiatives"), { recursive: true });
  writeFileSync(path.join(root, "docs/initiatives", "demo.md"), body, "utf-8");
  return root;
}

test("independent tasks integrate into main", async () => {
  const root = repoWithInitiative(twoParallelInitiative);
  const parsed = loadAndValidateInitiative("demo", root).parsed;
  const result = await runSequentialForTests({
    initiativeRelative: "docs/initiatives/demo.md",
    parsed,
    repoRoot: root,
    slug: "demo",
    workerFn: ({ record, task }) => {
      const file = task.writes[0];
      mkdirSync(path.dirname(path.join(record.worktreePath, file)), {
        recursive: true,
      });
      writeFileSync(path.join(record.worktreePath, file), task.id, "utf-8");
      return { ok: true, stdout: `built ${task.id}` };
    },
  });
  assert.equal(result.ok, true);
  assert.ok(existsSync(path.join(root, "pkg/a.txt")));
  assert.ok(existsSync(path.join(root, "pkg/b.txt")));
  assert.ok(existsSync(path.join(root, "pkg/c.txt")));
  const state = loadState({ repoRoot: root, slug: "demo" });
  assert.equal(state.tasks.c.status, "integrated");
});

test("dependent task starts from integrated main", async () => {
  const root = repoWithInitiative(twoParallelInitiative);
  const parsed = loadAndValidateInitiative("demo", root).parsed;
  await runSequentialForTests({
    initiativeRelative: "docs/initiatives/demo.md",
    parsed,
    repoRoot: root,
    slug: "demo",
    workerFn: ({ record, task }) => {
      mkdirSync(path.dirname(path.join(record.worktreePath, task.writes[0])), {
        recursive: true,
      });
      writeFileSync(
        path.join(record.worktreePath, task.writes[0]),
        `${task.id}\n`,
        "utf-8"
      );
      return { ok: true, stdout: `built ${task.id}` };
    },
  });
  const mainC = readFileSync(path.join(root, "pkg/c.txt"), "utf-8");
  assert.ok(mainC.includes("c"));
});

test("out-of-scope changes fail verification", async () => {
  const root = repoWithInitiative(twoParallelInitiative);
  const parsed = loadAndValidateInitiative("demo", root).parsed;
  const result = await runSequentialForTests({
    initiativeRelative: "docs/initiatives/demo.md",
    parsed,
    repoRoot: root,
    slug: "demo",
    workerFn: ({ record }) => {
      writeFileSync(
        path.join(record.worktreePath, "evil.txt"),
        "nope",
        "utf-8"
      );
      return { ok: true, stdout: "evil" };
    },
  });
  assert.equal(result.ok, false);
});

test("scoped checkpoint includes only owned dirty paths", () => {
  const root = repoWithInitiative(twoParallelInitiative);
  mkdirSync(path.join(root, "pkg"), { recursive: true });
  writeFileSync(path.join(root, "pkg/a.txt"), "dirty-a", "utf-8");
  writeFileSync(path.join(root, "unrelated.txt"), "stay", "utf-8");

  const { state } = prepareReadyTasks({
    initiativeRelative: "docs/initiatives/demo.md",
    parsed: loadAndValidateInitiative("demo", root).parsed,
    repoRoot: root,
    slug: "demo",
  });
  assert.ok(state.checkpointSha);
  assert.deepEqual(state.checkpointPaths, ["pkg/a.txt"]);
  assert.equal(readFileSync(path.join(root, "unrelated.txt"), "utf-8"), "stay");
});

test("cleanup refuses unintegrated dirty worktree", () => {
  const root = repoWithInitiative(twoParallelInitiative);
  const parsed = loadAndValidateInitiative("demo", root).parsed;
  const { state } = prepareReadyTasks({
    initiativeRelative: "docs/initiatives/demo.md",
    parsed,
    repoRoot: root,
    slug: "demo",
  });
  const record = state.tasks.a;
  writeFileSync(path.join(record.worktreePath, "dirty.txt"), "x", "utf-8");
  const cleanup = safeCleanupTask({
    force: false,
    repoRoot: root,
    slug: "demo",
    state,
    taskId: "a",
  });
  assert.equal(cleanup.ok, false);
});

test("git argv preserves metacharacters", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "flow-wt-git-"));
  initGitRepo(root);
  const weird = "pkg/weird;name.txt";
  mkdirSync(path.join(root, "pkg"), { recursive: true });
  writeFileSync(path.join(root, weird), "ok", "utf-8");
  runGit({ args: ["add", "--", weird], cwd: root });
  runGit({ args: ["commit", "-m", "weird path", "--no-verify"], cwd: root });
  assert.ok(existsSync(path.join(root, weird)));
});

test("concurrent write overlap across waves is rejected", () => {
  const body = `
## Waves

### Wave one

#### task: x

- mode: build
- flow_stage: Build
- depends_on: []
- writes:
  - pkg/shared.txt
- reads:
  - README.md
- skills:
  - incremental-implementation
- acceptance: true
- build_authorized: yes

### Wave two

#### task: y

- mode: build
- flow_stage: Build
- depends_on: []
- writes:
  - pkg/shared.txt
- reads:
  - README.md
- skills:
  - incremental-implementation
- acceptance: true
- build_authorized: yes
`;
  const root = repoWithInitiative(body);
  const result = loadAndValidateInitiative("demo", root);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("concurrent write overlap")));
});

test("no push commands in worktrees CLI path", async () => {
  const root = repoWithInitiative(twoParallelInitiative);
  const before = revParse({ cwd: root });
  const parsed = loadAndValidateInitiative("demo", root).parsed;
  await runSequentialForTests({
    initiativeRelative: "docs/initiatives/demo.md",
    parsed,
    repoRoot: root,
    slug: "demo",
    workerFn: ({ record, task }) => {
      mkdirSync(path.dirname(path.join(record.worktreePath, task.writes[0])), {
        recursive: true,
      });
      writeFileSync(
        path.join(record.worktreePath, task.writes[0]),
        task.id,
        "utf-8"
      );
      return { ok: true, stdout: `built ${task.id}` };
    },
  });
  const remote = spawnSync("git", ["remote"], { cwd: root, encoding: "utf-8" });
  assert.equal(remote.stdout.trim(), "");
  assert.notEqual(revParse({ cwd: root }), before);
});

test("question worker without output fails verification", async () => {
  const body = `
## Waves

### Wave one

#### task: review

- mode: question
- flow_stage: Review
- depends_on: []
- writes: []
- reads:
  - README.md
- skills:
  - incremental-implementation
`;
  const root = repoWithInitiative(body);
  const parsed = loadAndValidateInitiative("demo", root).parsed;
  const result = await runInitiative({
    initiativeRelative: "docs/initiatives/demo.md",
    parsed,
    repoRoot: root,
    slug: "demo",
    workerFn: () => ({ ok: true, stdout: "" }),
  });
  assert.equal(result.ok, false);
});

test("parallel workers overlap under async pool", async () => {
  const root = repoWithInitiative(twoParallelInitiative);
  const parsed = loadAndValidateInitiative("demo", root).parsed;
  let inFlight = 0;
  let maxSeen = 0;
  const result = await runInitiative({
    initiativeRelative: "docs/initiatives/demo.md",
    parsed,
    repoRoot: root,
    slug: "demo",
    workerFn: async ({ record, task }) => {
      inFlight += 1;
      maxSeen = Math.max(maxSeen, inFlight);
      await delay(50);
      inFlight -= 1;
      mkdirSync(path.dirname(path.join(record.worktreePath, task.writes[0])), {
        recursive: true,
      });
      writeFileSync(
        path.join(record.worktreePath, task.writes[0]),
        task.id,
        "utf-8"
      );
      return { ok: true, stdout: `built ${task.id}` };
    },
  });
  assert.equal(result.ok, true);
  assert.ok(maxSeen >= 2);
});
