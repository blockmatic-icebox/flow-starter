import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { repoRoot } from "../lib/repo-paths.mjs";

const installScript = join(repoRoot, ".agents/tooling/setup/install.sh");
const sourceUrl = `file://${repoRoot}`;

const gitIdentityEnv = {
  GIT_AUTHOR_EMAIL: "test@flow-starter.local",
  GIT_AUTHOR_NAME: "flow-starter-test",
  GIT_COMMITTER_EMAIL: "test@flow-starter.local",
  GIT_COMMITTER_NAME: "flow-starter-test",
};

test("generated product passes applicable factory checks", () => {
  const parent = mkdtempSync(join(tmpdir(), "flow-adoption-"));
  const install = spawnSync("bash", [installScript], {
    cwd: parent,
    encoding: "utf-8",
    env: {
      ...process.env,
      ...gitIdentityEnv,
      FLOW_STARTER_PROJECT_NAME: "adoption-check",
      FLOW_STARTER_SOURCE: sourceUrl,
    },
  });
  assert.equal(install.status, 0, install.stderr || install.stdout);

  const projectRoot = join(parent, "adoption-check");
  const agentsRoot = join(projectRoot, ".agents");

  assert.ok(!existsSync(join(projectRoot, "prompts.txt")));
  assert.ok(existsSync(join(projectRoot, ".agents/flow/prompts.txt")));
  assert.equal(
    readFileSync(join(projectRoot, ".agents/flow/prompts.txt"), "utf-8"),
    ""
  );
  assert.ok(!existsSync(join(projectRoot, ".agents/tooling/setup/install.sh")));
  assert.ok(!existsSync(join(agentsRoot, "tooling/setup/install.test.mjs")));
  assert.ok(!existsSync(join(agentsRoot, "eval/src/assessment/run.test.ts")));
  assert.ok(
    !existsSync(
      join(agentsRoot, "eval/fixtures/assessments/technical-ai-assessment")
    )
  );

  const tooling = spawnSync(
    "node",
    [
      "--test",
      "tooling/worktrees/*.test.mjs",
      "tooling/security/*.test.mjs",
      "tooling/checks/check-staged.test.mjs",
      "tooling/setup/prompt-log.test.mjs",
    ],
    { cwd: agentsRoot, encoding: "utf-8", shell: true }
  );
  assert.equal(
    tooling.status,
    0,
    tooling.stderr || tooling.stdout || "tooling tests failed"
  );

  const deps = spawnSync("pnpm", ["install", "--frozen-lockfile"], {
    cwd: projectRoot,
    encoding: "utf-8",
    env: { ...process.env, ...gitIdentityEnv },
  });
  if (deps.status === 0) {
    const agentsInstall = spawnSync("pnpm", ["install"], {
      cwd: agentsRoot,
      encoding: "utf-8",
      env: { ...process.env, ...gitIdentityEnv },
    });
    assert.equal(
      agentsInstall.status,
      0,
      agentsInstall.stderr || agentsInstall.stdout || "agents install failed"
    );
    const flowEval = spawnSync("pnpm", ["eval:test"], {
      cwd: agentsRoot,
      encoding: "utf-8",
    });
    assert.equal(
      flowEval.status,
      0,
      flowEval.stderr || flowEval.stdout || "flow-eval tests failed"
    );
  }

  rmSync(parent, { force: true, recursive: true });
});
