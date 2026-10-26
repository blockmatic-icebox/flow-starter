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
import { dirname, join } from "node:path";
import test from "node:test";

import { validateFlowDocs } from "../checks/check-flow-docs.mjs";
import { repoRoot } from "../lib/repo-paths.mjs";
import { createLocalInstallSource } from "./local-install-source.mjs";

const installScript = join(repoRoot, ".agents/tooling/setup/install.sh");
const installScriptDir = dirname(installScript);

const gitIdentityEnv = {
  GIT_AUTHOR_EMAIL: "test@flow-starter.local",
  GIT_AUTHOR_NAME: "flow-starter-test",
  GIT_COMMITTER_EMAIL: "test@flow-starter.local",
  GIT_COMMITTER_NAME: "flow-starter-test",
};

const runInstallDirect = ({ cwd, projectName, sourceUrl }) =>
  spawnSync("bash", [installScript], {
    cwd,
    encoding: "utf-8",
    env: {
      ...process.env,
      ...gitIdentityEnv,
      FLOW_FACTORY_PROJECT_NAME: projectName,
      FLOW_FACTORY_SOURCE: sourceUrl,
      INSTALL_SCRIPT_DIR: installScriptDir,
    },
  });

const runInstallCommandString = ({ cwd, projectName, sourceUrl }) => {
  const script = readFileSync(installScript, "utf-8");
  return spawnSync("bash", ["-c", script], {
    cwd,
    encoding: "utf-8",
    env: {
      ...process.env,
      ...gitIdentityEnv,
      FLOW_FACTORY_PROJECT_NAME: projectName,
      FLOW_FACTORY_SOURCE: sourceUrl,
      INSTALL_SCRIPT_DIR: installScriptDir,
    },
  });
};

const assertAdoptedProject = ({ parent, projectName, slug }) => {
  const projectRoot = join(parent, slug);
  assert.ok(existsSync(projectRoot), `missing project dir ${slug}`);

  const readme = readFileSync(join(projectRoot, "README.md"), "utf-8");
  assert.match(readme, new RegExp(`^# ${projectName}\\n`, "u"));
  assert.match(readme, /Web application built with Flow Factory/u);
  assert.doesNotMatch(readme, /curl|raw\.githubusercontent/u);
  assert.match(readme, new RegExp(`https://${slug}\\.localhost`, "u"));

  const product = readFileSync(join(projectRoot, "PRODUCT.md"), "utf-8");
  assert.match(product, new RegExp(`# ${projectName} — Product`, "u"));
  assert.doesNotMatch(product, /not initialized/iu);

  const design = readFileSync(join(projectRoot, "DESIGN.md"), "utf-8");
  assert.doesNotMatch(design, /not initialized/iu);
  assert.match(design, /Experience direction/u);

  const arch = readFileSync(join(projectRoot, "ARCHITECTURE.md"), "utf-8");
  assert.match(arch, /progressively maintained product contracts/u);

  const pkg = JSON.parse(
    readFileSync(join(projectRoot, "package.json"), "utf-8")
  );
  assert.equal(pkg.name, slug);
  assert.equal(pkg.scripts?.["knip:factory"], undefined);

  const webPkg = JSON.parse(
    readFileSync(join(projectRoot, "apps/web/package.json"), "utf-8")
  );
  assert.equal(webPkg.portless.name, slug);

  assert.ok(existsSync(join(projectRoot, ".agents/flow/README.md")));
  assert.ok(
    existsSync(join(projectRoot, "docs/decisions/0001-use-flow-factory.md"))
  );

  assert.ok(!existsSync(join(projectRoot, ".agents/tooling/setup/install.sh")));
  assert.ok(
    !existsSync(join(projectRoot, ".agents/tooling/setup/product-adoption.mjs"))
  );
  assert.ok(
    !existsSync(
      join(projectRoot, ".agents/tooling/setup/clean-adoption.test.mjs")
    )
  );
  assert.ok(
    !existsSync(
      join(projectRoot, ".agents/tooling/setup/local-install-source.mjs")
    )
  );

  const agentsPkg = JSON.parse(
    readFileSync(join(projectRoot, ".agents/package.json"), "utf-8")
  );
  assert.doesNotMatch(
    agentsPkg.scripts["test:tooling"],
    /product-adoption\.test\.mjs/u
  );

  assert.equal(
    readFileSync(join(projectRoot, ".agents/flow/prompts.txt"), "utf-8"),
    ""
  );

  const flowErrors = validateFlowDocs(projectRoot);
  assert.equal(flowErrors.length, 0, flowErrors.join("\n"));

  const status = execSync("git status --porcelain", {
    cwd: projectRoot,
    encoding: "utf-8",
  });
  assert.equal(status.trim(), "");

  const log = execSync("git log --oneline", {
    cwd: projectRoot,
    encoding: "utf-8",
  });
  assert.match(log, /^[a-f0-9]+ Initial commit/u);

  return projectRoot;
};

test("installs via direct bash with local working-tree snapshot", () => {
  const { cleanup, sourceUrl } = createLocalInstallSource({ repoRoot });
  const parent = mkdtempSync(join(tmpdir(), "flow-install-direct-"));
  try {
    const result = runInstallDirect({
      cwd: parent,
      projectName: "Acme Widgets",
      sourceUrl,
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assertAdoptedProject({
      parent,
      projectName: "Acme Widgets",
      slug: "acme-widgets",
    });
  } finally {
    rmSync(parent, { force: true, recursive: true });
    cleanup();
  }
});

test("installs via bash -c command-string with local snapshot", () => {
  const { cleanup, sourceUrl } = createLocalInstallSource({ repoRoot });
  const parent = mkdtempSync(join(tmpdir(), "flow-install-cmd-"));
  try {
    const result = runInstallCommandString({
      cwd: parent,
      projectName: "My Cool App",
      sourceUrl,
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assertAdoptedProject({
      parent,
      projectName: "My Cool App",
      slug: "my-cool-app",
    });
  } finally {
    rmSync(parent, { force: true, recursive: true });
    cleanup();
  }
});

test("refuses an existing destination directory", () => {
  const { cleanup, sourceUrl } = createLocalInstallSource({ repoRoot });
  const parent = mkdtempSync(join(tmpdir(), "flow-install-taken-"));
  mkdirSync(join(parent, "taken"));
  try {
    const result = runInstallDirect({
      cwd: parent,
      projectName: "taken",
      sourceUrl,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr ?? result.stdout, /directory already exists/u);
  } finally {
    rmSync(parent, { force: true, recursive: true });
    cleanup();
  }
});

test("refuses portless reserved slug", () => {
  const { cleanup, sourceUrl } = createLocalInstallSource({ repoRoot });
  const parent = mkdtempSync(join(tmpdir(), "flow-install-reserved-"));
  try {
    const result = runInstallDirect({
      cwd: parent,
      projectName: "run",
      sourceUrl,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr ?? result.stdout, /reserved by portless/u);
  } finally {
    rmSync(parent, { force: true, recursive: true });
    cleanup();
  }
});

test("refuses invalid empty project name", () => {
  const { cleanup, sourceUrl } = createLocalInstallSource({ repoRoot });
  const parent = mkdtempSync(join(tmpdir(), "flow-install-empty-"));
  try {
    const result = runInstallDirect({
      cwd: parent,
      projectName: "   ",
      sourceUrl,
    });
    assert.notEqual(result.status, 0);
  } finally {
    rmSync(parent, { force: true, recursive: true });
    cleanup();
  }
});
