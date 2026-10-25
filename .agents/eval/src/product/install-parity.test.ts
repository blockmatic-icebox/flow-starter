import assert from "node:assert/strict";
import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { repoRoot } from "../paths.ts";
import { buildSubjectIdentity } from "../subject-identity.ts";
import { prepareInstalledSubject } from "./prepare-installed-product.ts";

const installScript = path.join(repoRoot, ".agents/tooling/setup/install.sh");

const gitIdentityEnv = {
  GIT_AUTHOR_EMAIL: "test@flow-starter.local",
  GIT_AUTHOR_NAME: "flow-starter-test",
  GIT_COMMITTER_EMAIL: "test@flow-starter.local",
  GIT_COMMITTER_NAME: "flow-starter-test",
};

describe(
  "install parity",
  { skip: process.env.FLOW_EVAL_INSTALL_PARITY !== "1" },
  () => {
    it("eval worktree matches installer adoption surface", () => {
      const parent = mkdtempSync(path.join(tmpdir(), "flow-eval-parity-"));
      const projectName = "Parity Widget Co";
      const slug = "parity-widget-co";
      const sourceUrl = `file://${repoRoot}`;
      const installResult = spawnSync("bash", [installScript], {
        cwd: parent,
        encoding: "utf-8",
        env: {
          ...process.env,
          ...gitIdentityEnv,
          FLOW_FACTORY_PROJECT_NAME: projectName,
          FLOW_FACTORY_SOURCE: sourceUrl,
        },
      });
      assert.equal(installResult.status, 0, installResult.stderr);

      const flowSha = execSync("git rev-parse HEAD", {
        cwd: repoRoot,
        encoding: "utf-8",
      }).trim();
      const identity = buildSubjectIdentity({
        arm: "flow",
        prepareNonce: "parity",
        repetition: 1,
        runId: "parity-run",
        scenarioId: "S01",
      });
      process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP = "1";
      const evalPrepared = prepareInstalledSubject({
        arm: "flow",
        flowSha,
        prepareNonce: "parity",
        repetition: 1,
        runId: "parity-run",
        scenarioId: "S01",
        skipInstall: true,
        withFixture: false,
        withSetup: false,
      });

      const installedRoot = path.join(parent, slug);
      const evalPkg = JSON.parse(
        readFileSync(
          path.join(evalPrepared.worktreePath, "package.json"),
          "utf-8"
        )
      );
      const installedPkg = JSON.parse(
        readFileSync(path.join(installedRoot, "package.json"), "utf-8")
      );
      assert.equal(
        evalPkg.name,
        identity.productName.replace(/^product-/u, "product-")
      );
      assert.equal(installedPkg.name, slug);
      const installedWeb = JSON.parse(
        readFileSync(path.join(installedRoot, "apps/web/package.json"), "utf-8")
      );
      assert.equal(installedWeb.portless.name, slug);
      assert.match(
        readFileSync(
          path.join(installedRoot, "apps/web/next.config.ts"),
          "utf-8"
        ),
        new RegExp(`${slug}\\.localhost`, "u")
      );
      assert.match(
        readFileSync(path.join(installedRoot, "README.md"), "utf-8"),
        new RegExp(`^# ${projectName}\\n`, "u")
      );
      assert.ok(existsSync(path.join(evalPrepared.worktreePath, "README.md")));
      assert.ok(
        !existsSync(
          path.join(
            evalPrepared.worktreePath,
            ".agents/tooling/setup/install.sh"
          )
        )
      );
      assert.ok(
        !existsSync(
          path.join(installedRoot, ".agents/tooling/setup/install.sh")
        )
      );

      rmSync(parent, { force: true, recursive: true });
      runGitWorktreeCleanup(evalPrepared.worktreePath);
    });
  }
);

const runGitWorktreeCleanup = (worktreePath: string) => {
  if (!existsSync(worktreePath)) return;
  spawnSync("git", ["worktree", "remove", "--force", worktreePath], {
    cwd: repoRoot,
    encoding: "utf-8",
  });
};
