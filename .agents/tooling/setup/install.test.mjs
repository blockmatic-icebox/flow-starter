import assert from "node:assert/strict";
import { execSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
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

const runInstall = ({ cwd, projectName, extraEnv = {} }) =>
  spawnSync("bash", [installScript], {
    cwd,
    encoding: "utf-8",
    env: {
      ...process.env,
      ...gitIdentityEnv,
      FLOW_STARTER_PROJECT_NAME: projectName,
      FLOW_STARTER_SOURCE: sourceUrl,
      ...extraEnv,
    },
  });

test("installs a project with slug hostname and fresh git", () => {
  const parent = mkdtempSync(join(tmpdir(), "flow-install-"));
  const result = runInstall({ cwd: parent, projectName: "Acme Widgets" });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const projectRoot = join(parent, "acme-widgets");
  assert.ok(existsSync(join(projectRoot, ".agents/flow/factory.md")));
  assert.ok(!existsSync(join(projectRoot, "CLAUDE.md")));
  assert.ok(existsSync(join(projectRoot, "prompts.txt")));
  assert.equal(readFileSync(join(projectRoot, "prompts.txt"), "utf-8"), "");
  assert.ok(!existsSync(join(projectRoot, installScript)));
  assert.ok(
    !existsSync(
      join(
        projectRoot,
        ".agents/eval/fixtures/assessments/technical-ai-assessment"
      )
    )
  );
  assert.ok(
    !existsSync(
      join(projectRoot, ".agents/flow/operations/assessment-adoption.md")
    )
  );

  const nextConfig = readFileSync(
    join(projectRoot, "apps/web/next.config.ts"),
    "utf-8"
  );
  assert.match(nextConfig, /acme-widgets\.localhost/u);
  assert.doesNotMatch(nextConfig, /apps\/flow/u);

  const status = execSync("git status --porcelain", {
    cwd: projectRoot,
    encoding: "utf-8",
  });
  assert.equal(status.trim(), "");

  rmSync(parent, { force: true, recursive: true });
});

test("slugifies names with spaces", () => {
  const parent = mkdtempSync(join(tmpdir(), "flow-install-"));
  const result = runInstall({ cwd: parent, projectName: "My Cool App" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(existsSync(join(parent, "my-cool-app", "package.json")));
  rmSync(parent, { force: true, recursive: true });
});

test("refuses an existing destination directory", () => {
  const parent = mkdtempSync(join(tmpdir(), "flow-install-"));
  mkdirSync(join(parent, "taken"));
  const result = runInstall({ cwd: parent, projectName: "taken" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr ?? result.stdout, /directory already exists/u);
  rmSync(parent, { force: true, recursive: true });
});

test("refuses portless reserved slug", () => {
  const parent = mkdtempSync(join(tmpdir(), "flow-install-"));
  const result = runInstall({ cwd: parent, projectName: "run" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr ?? result.stdout, /reserved by portless/u);
  rmSync(parent, { force: true, recursive: true });
});
