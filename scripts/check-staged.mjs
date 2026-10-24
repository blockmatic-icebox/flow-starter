#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { exit } from "node:process";
import { pathToFileURL } from "node:url";

const repoRoot = join(import.meta.dirname, "..");

export const parseNulPaths = (buffer) =>
  Buffer.from(buffer)
    .toString("utf-8")
    .split("\0")
    .filter((file) => file.length > 0);

const codePattern = /\.(?:[cm]?[jt]sx?)$/u;

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
      (file.startsWith("scripts/") &&
        /secret|security|gitleaks|osv|check-staged/u.test(file));

    if (isMarkdown) markdown.push(file);
    if (isCode) code.push(file);
    if (isManifest) manifests.push(file);
    if (isSecurity) security.push(file);
    if (
      !isMarkdown &&
      !isCode &&
      !isManifest &&
      !isSecurity &&
      /\.(?:css|json|ya?ml)$/u.test(file)
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
  if (groups.markdown.length > 0)
    checks.push({
      args: ["scripts/check-flow-docs.mjs"],
      cmd: process.execPath,
    });
  if (groups.code.length > 0)
    checks.push(
      { args: ["exec", "oxlint", ...groups.code], cmd: "pnpm" },
      {
        args: ["exec", "oxfmt", "--check", ...groups.code],
        cmd: "pnpm",
      }
    );
  if (groups.manifests.length > 0)
    checks.push({
      args: ["scripts/check-react-architecture.mjs"],
      cmd: process.execPath,
    });
  if (groups.security.length > 0)
    checks.push({
      args: [
        "--test",
        "scripts/block-secret-files.test.mjs",
        "scripts/check-staged.test.mjs",
        "tests/security/secret-scanner-smoke.test.mjs",
      ],
      cmd: process.execPath,
    });
  if (groups.other.length > 0)
    checks.push({
      args: ["exec", "oxfmt", "--check", ...groups.other],
      cmd: "pnpm",
    });
  return checks;
};

const main = () => {
  const staged = readStagedPaths({ cwd: repoRoot });
  if (!staged.ok) {
    console.error("\nUnable to read staged files.\n");
    exit(1);
  }
  if (staged.paths.length === 0) exit(0);

  for (const check of stagedChecks(staged.paths)) {
    const status = run({ ...check, cwd: repoRoot });
    if (status !== 0) exit(status);
  }
};

const entrypoint = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : null;

if (import.meta.url === entrypoint) main();
