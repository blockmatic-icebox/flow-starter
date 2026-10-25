#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { repoRoot } from "../lib/repo-paths.mjs";

const forbiddenPaths = [
  "apps/flow",
  "packages/flow-eval",
  "scripts",
  "GLOSSARY.md",
];

const forbiddenImportPatterns = [
  /from\s+["']@repo\/flow-eval/u,
  /from\s+["']\.\.\/\.\.\/\.agents/u,
  /from\s+["']\.agents\//u,
];

function listFiles(dir, { extensions = null } = {}) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      out.push(...listFiles(full, { extensions }));
      continue;
    }
    if (extensions && !extensions.some((ext) => entry.name.endsWith(ext)))
      continue;
    out.push(full);
  }
  return out;
}

const isFactoryRootScript = (name) =>
  name.startsWith("flow:") ||
  name.startsWith("flow-eval:") ||
  name === "worktrees" ||
  name.startsWith("architecture:") ||
  name.startsWith("skills:") ||
  name === "commits:check" ||
  (name.startsWith("eval:") && !name.startsWith("eval:genui"));

const collectLayoutErrors = (root) => {
  const errors = [];
  for (const relative of forbiddenPaths) {
    if (existsSync(path.join(root, relative)))
      errors.push(`forbidden path present: ${relative}`);
  }
  if (existsSync(path.join(root, "packages/flow-eval")))
    errors.push("Factory evaluation must live at .agents/eval, not packages/");
  const workspaceFile = path.join(root, "pnpm-workspace.yaml");
  if (
    existsSync(workspaceFile) &&
    /\.agents/u.test(readFileSync(workspaceFile, "utf-8"))
  )
    errors.push(
      "pnpm-workspace.yaml must not register Factory packages under .agents/"
    );
  if (existsSync(path.join(root, "skills-lock.json")))
    errors.push(
      "skills-lock.json belongs at .agents/skills-lock.json, not repository root"
    );
  if (existsSync(path.join(root, "prompts.txt")))
    errors.push(
      "prompts.txt belongs at .agents/flow/prompts.txt, not repository root"
    );
  return errors;
};

const collectRootPackageErrors = (root) => {
  const rootPkg = path.join(root, "package.json");
  if (!existsSync(rootPkg)) return [];
  const pkg = JSON.parse(readFileSync(rootPkg, "utf-8"));
  const errors = [];
  for (const name of Object.keys(pkg.scripts ?? {})) {
    if (isFactoryRootScript(name))
      errors.push(
        `root package.json must not forward Factory script "${name}"; use pnpm --dir .agents`
      );
  }
  if ((pkg.devDependencies ?? {}).skills)
    errors.push(
      "root package.json must not list Factory devDependency skills; use pnpm --dir .agents"
    );
  return errors;
};

export function validateRepositoryOwnership(root = repoRoot) {
  const errors = [
    ...collectLayoutErrors(root),
    ...collectRootPackageErrors(root),
  ];

  const productCodeRoots = [
    path.join(root, "apps/web"),
    path.join(root, "packages/db"),
    path.join(root, "packages/genui"),
    path.join(root, "packages/ui"),
    path.join(root, "packages/ts"),
  ];

  for (const dir of productCodeRoots) {
    for (const file of listFiles(dir, {
      extensions: [".ts", ".tsx", ".mjs"],
    })) {
      const content = readFileSync(file, "utf-8");
      for (const pattern of forbiddenImportPatterns) {
        if (pattern.test(content)) {
          errors.push(
            `${path.relative(root, file)}: product code must not import Factory implementation`
          );
          break;
        }
      }
    }
  }

  return errors;
}

function main() {
  const errors = validateRepositoryOwnership();
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log("Repository ownership check passed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
