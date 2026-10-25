#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { exit } from "node:process";
import { pathToFileURL } from "node:url";

import { agentsRoot, repoRoot } from "../lib/repo-paths.mjs";

const checksDir = path.join(import.meta.dirname);
const agentsChecksDir = path.join(agentsRoot, "tooling/checks");

export const parseNulPaths = (buffer) =>
  Buffer.from(buffer)
    .toString("utf-8")
    .split("\0")
    .filter((file) => file.length > 0);

const codePattern = /\.(?:[cm]?[jt]sx?)$/u;

const isOxfmtOtherFile = (file) => {
  const base = file.split("/").pop() ?? file;
  if (base === "pnpm-lock.yaml" || base.endsWith(".lock")) return false;
  return /\.(?:css|json|ya?ml)$/u.test(file);
};

export const classifyStagedPaths = (paths) => {
  const code = [];
  const manifests = [];
  const markdown = [];
  const other = [];
  const security = [];

  for (const file of paths) {
    const base = file.split("/").pop() ?? file;
    const isMarkdown = file.endsWith(".md") || file.endsWith(".mdx");
    const isCode = codePattern.test(file);
    const isManifest =
      base === "package.json" ||
      base === "pnpm-workspace.yaml" ||
      file === "turbo.json";
    const isSecurity =
      file === ".gitleaks.toml" ||
      file === ".gitignore" ||
      file.startsWith(".github/workflows/") ||
      ((file.startsWith(".agents/tooling/") || file.startsWith("tooling/")) &&
        /secret|security|gitleaks|osv|check-staged|check-commit|conventional-commit/u.test(
          file
        ));

    if (isMarkdown) markdown.push(file);
    if (isCode) code.push(file);
    if (isManifest) manifests.push(file);
    if (isSecurity) security.push(file);
    if (
      !isMarkdown &&
      !isCode &&
      !isManifest &&
      !isSecurity &&
      isOxfmtOtherFile(file)
    )
      other.push(file);
  }

  return { code, manifests, markdown, other, security };
};

export const readStagedPaths = ({ cwd = process.cwd() } = {}) => {
  const result = spawnSync(
    "git",
    ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR"],
    { cwd, encoding: "buffer" }
  );
  if (result.status !== 0) return { ok: false, paths: [] };
  return { ok: true, paths: parseNulPaths(result.stdout) };
};

const run = ({ args, cmd, cwd }) => {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  return result.status ?? 1;
};

export const stagedChecks = (paths) => {
  const groups = classifyStagedPaths(paths);
  const checks = [];
  const flowDocs = path.join(agentsChecksDir, "check-flow-docs.mjs");
  const reactArch = path.join(agentsChecksDir, "check-react-architecture.mjs");
  const blockSecretsTest = path.join(
    import.meta.dirname,
    "../security/block-secret-files.test.mjs"
  );
  const stagedTest = path.join(checksDir, "check-staged.test.mjs");
  const scannerSmoke = path.join(
    import.meta.dirname,
    "../security/tests/secret-scanner-smoke.test.mjs"
  );

  if (groups.markdown.length > 0 && existsSync(flowDocs))
    checks.push({ args: [flowDocs], cmd: process.execPath });
  if (groups.code.length > 0)
    checks.push({ args: ["exec", "oxlint", ...groups.code], cmd: "pnpm" });
  const touchesWebApp = paths.some(
    (file) => file.startsWith("apps/web/app/") && codePattern.test(file)
  );
  if (touchesWebApp)
    checks.push({ args: ["--filter", "web", "check-types"], cmd: "pnpm" });
  if (groups.code.length > 0)
    checks.push({
      args: ["exec", "oxfmt", "--check", ...groups.code],
      cmd: "pnpm",
    });
  if (groups.manifests.length > 0 && existsSync(reactArch))
    checks.push({ args: [reactArch], cmd: process.execPath });
  if (groups.security.length > 0)
    checks.push({
      args: ["--test", blockSecretsTest, stagedTest, scannerSmoke],
      cmd: process.execPath,
    });
  if (groups.other.length > 0)
    checks.push({
      args: ["exec", "oxfmt", "--check", ...groups.other],
      cmd: "pnpm",
    });
  return checks;
};

function main() {
  const { ok, paths } = readStagedPaths({ cwd: repoRoot });
  if (!ok) exit(1);
  if (paths.length === 0) exit(0);

  for (const check of stagedChecks(paths)) {
    const status = run({ ...check, cwd: repoRoot });
    if (status !== 0) exit(status);
  }
  exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
