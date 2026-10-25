import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { repoRoot } from "../lib/repo-paths.mjs";
import { createLocalInstallSource } from "./local-install-source.mjs";

const installScript = join(repoRoot, ".agents/tooling/setup/install.sh");

const gitIdentityEnv = {
  GIT_AUTHOR_EMAIL: "test@flow-starter.local",
  GIT_AUTHOR_NAME: "flow-starter-test",
  GIT_COMMITTER_EMAIL: "test@flow-starter.local",
  GIT_COMMITTER_NAME: "flow-starter-test",
};

test(
  "generated product passes applicable factory checks",
  { timeout: 600_000 },
  () => {
    const { cleanup, sourceUrl } = createLocalInstallSource({ repoRoot });
    const parent = mkdtempSync(join(tmpdir(), "flow-adoption-"));
    try {
      const install = spawnSync("bash", [installScript], {
        cwd: parent,
        encoding: "utf-8",
        env: {
          ...process.env,
          ...gitIdentityEnv,
          FLOW_FACTORY_PROJECT_NAME: "adoption-check",
          FLOW_FACTORY_SOURCE: sourceUrl,
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
      assert.ok(
        !existsSync(join(projectRoot, ".agents/tooling/setup/install.sh"))
      );
      assert.ok(
        !existsSync(join(agentsRoot, "tooling/setup/install.test.mjs"))
      );
      assert.ok(
        !existsSync(join(agentsRoot, "eval/src/assessment/run.test.ts"))
      );
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
          "../tooling/security/*.test.mjs",
          "../tooling/checks/check-staged.test.mjs",
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
      assert.equal(
        deps.status,
        0,
        deps.stderr || deps.stdout || "root install failed"
      );

      const agentsInstall = spawnSync(
        "pnpm",
        ["install", "--frozen-lockfile"],
        {
          cwd: agentsRoot,
          encoding: "utf-8",
          env: { ...process.env, ...gitIdentityEnv },
        }
      );
      assert.equal(
        agentsInstall.status,
        0,
        agentsInstall.stderr || agentsInstall.stdout || "agents install failed"
      );

      const qa = spawnSync("pnpm", ["qa"], {
        cwd: projectRoot,
        encoding: "utf-8",
      });
      assert.equal(qa.status, 0, qa.stderr || qa.stdout || "pnpm qa failed");

      const flowCheck = spawnSync("pnpm", ["flow:check"], {
        cwd: agentsRoot,
        encoding: "utf-8",
      });
      assert.equal(
        flowCheck.status,
        0,
        flowCheck.stderr || flowCheck.stdout || "flow:check failed"
      );

      const agentsTest = spawnSync("pnpm", ["test"], {
        cwd: agentsRoot,
        encoding: "utf-8",
      });
      assert.equal(
        agentsTest.status,
        0,
        agentsTest.stderr || agentsTest.stdout || "agents test failed"
      );

      const build = spawnSync("pnpm", ["build"], {
        cwd: projectRoot,
        encoding: "utf-8",
      });
      assert.equal(
        build.status,
        0,
        build.stderr || build.stdout || "build failed"
      );
    } finally {
      rmSync(parent, { force: true, recursive: true });
      cleanup();
    }
  }
);
