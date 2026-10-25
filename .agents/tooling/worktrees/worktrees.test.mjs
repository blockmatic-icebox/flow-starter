import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { initiativePath } from "./initiative.mjs";
import {
  loadAndValidateInitiative,
  parseInitiativeWaves,
} from "./worktrees.mjs";

const validInitiative = `
# Example initiative

## Waves

### Wave foundation

#### task: contract

- mode: build
- flow_stage: Build
- depends_on: []
- writes:
  - packages/example/src/contract.ts
- reads:
  - AGENTS.md
- skills:
  - incremental-implementation
- acceptance: pnpm test
- build_authorized: yes

### Wave parallel-ui

#### task: ui-a

- mode: build
- flow_stage: Build
- depends_on:
  - contract
- writes:
  - apps/web/app/a/page.tsx
- reads:
  - DESIGN.md
- skills:
  - nextjs
- acceptance: pnpm lint
- build_authorized: yes

#### task: ui-b

- mode: build
- flow_stage: Build
- depends_on:
  - contract
- writes:
  - apps/web/app/b/page.tsx
- reads:
  - DESIGN.md
- skills:
  - nextjs
- acceptance: pnpm lint
- build_authorized: yes
`;

function tempRepo(initiativeBody = validInitiative) {
  const root = mkdtempSync(path.join(os.tmpdir(), "flow-worktrees-"));
  mkdirSync(path.join(root, "docs/initiatives"), { recursive: true });
  mkdirSync(path.join(root, ".agents"), { recursive: true });
  writeFileSync(
    path.join(root, ".agents/skills-lock.json"),
    JSON.stringify({
      skills: {
        "incremental-implementation": {},
        nextjs: {},
      },
      version: 1,
    }),
    "utf-8"
  );
  writeFileSync(
    path.join(root, "docs/initiatives", "sample.md"),
    initiativeBody,
    "utf-8"
  );
  return root;
}

test("initiativePath resolves .agents/flow/initiatives", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "flow-worktrees-"));
  const flowInitiativeDir = path.join(root, ".agents/flow/initiatives");
  mkdirSync(flowInitiativeDir, { recursive: true });
  writeFileSync(
    path.join(flowInitiativeDir, "flow-eval.md"),
    "# Eval\n",
    "utf-8"
  );
  assert.equal(
    initiativePath("flow-eval", root),
    path.join(flowInitiativeDir, "flow-eval.md")
  );
});

test("parseInitiativeWaves reads two waves and three tasks", () => {
  const { waves } = parseInitiativeWaves(validInitiative);
  assert.equal(waves.size, 2);
  assert.equal(waves.get("foundation").length, 1);
  assert.equal(waves.get("parallel-ui").length, 2);
});

test("validateWaves accepts valid parallel wave", () => {
  const root = tempRepo();
  const result = loadAndValidateInitiative("sample", root);
  assert.equal(result.ok, true);
});

test("validateWaves rejects overlapping writes in same wave", () => {
  const overlap = validInitiative.replace(
    "apps/web/app/b/page.tsx",
    "apps/web/app/a/page.tsx"
  );
  const root = tempRepo(overlap);
  const result = loadAndValidateInitiative("sample", root);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => message.includes("write overlap")));
});

test("validateWaves rejects build without authorization", () => {
  const unauthorized = validInitiative.replace(
    "build_authorized: yes",
    "build_authorized: no"
  );
  const root = tempRepo(unauthorized);
  const result = loadAndValidateInitiative("sample", root);
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((message) => message.includes("build_authorized"))
  );
});

test("validateWaves detects dependency cycles", () => {
  const cyclic = `${validInitiative}

### Wave bad

#### task: loop-a

- mode: question
- flow_stage: Explore
- depends_on:
  - loop-b
- writes: []
- reads:
  - AGENTS.md
- skills:
  - nextjs

#### task: loop-b

- mode: question
- flow_stage: Explore
- depends_on:
  - loop-a
- writes: []
- reads:
  - AGENTS.md
- skills:
  - nextjs
`;
  const root = tempRepo(cyclic);
  const result = loadAndValidateInitiative("sample", root);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((message) => message.includes("cycle")));
});
