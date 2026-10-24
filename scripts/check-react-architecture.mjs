import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript-ast";

const repositoryRoot = path.resolve(import.meta.dirname, "..");

const uiSourceRoot = "packages/ui/src";
const genuiSourceRoot = "packages/genui/src";
const webAppRoot = "apps/web";
const rootLayoutRelative = "apps/web/app/layout.tsx";

const uiForbiddenModules = new Set([
  "@repo/genui",
  "next/server",
  "next/headers",
  "node:fs",
  "node:fs/promises",
  "node:path",
  "fs",
  "path",
]);

const serverOnlyModulePrefixes = ["next/server", "next/headers"];

function walkSourceFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkSourceFiles(absolute));
    } else if (/\.(?:tsx?|mts)$/u.test(entry.name)) {
      files.push(absolute);
    }
  }

  return files;
}

function collectModuleSpecifiers(sourceFile) {
  const specifiers = [];

  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push({
        isTypeOnly:
          ts.isImportDeclaration(node) &&
          node.importClause?.isTypeOnly === true,
        specifier: node.moduleSpecifier.text,
      });
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push({
        isTypeOnly: false,
        specifier: node.arguments[0].text,
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return specifiers;
}

function parseSourceFile(absolutePath) {
  const content = readFileSync(absolutePath, "utf-8");
  const scriptKind = absolutePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;

  return ts.createSourceFile(
    absolutePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
}

function relativeFromRoot(absolutePath, root = repositoryRoot) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function isAppAlias(specifier) {
  return specifier === "@" || specifier.startsWith("@/");
}

function isAppPathImport(specifier) {
  return (
    specifier.includes("apps/web") ||
    specifier.includes("/apps/web/") ||
    /^(?<dots>\.\.\/)+apps\/web/u.test(specifier)
  );
}

function violatesUiImport({ specifier }) {
  if (isAppAlias(specifier) || isAppPathImport(specifier)) {
    return {
      expected:
        "@repo/ui must not import application code or @/ application aliases",
      rule: "shared-ui-no-app-imports",
    };
  }

  if (specifier === "@repo/genui" || specifier.startsWith("@repo/genui/")) {
    return {
      expected: "@repo/ui must not depend on @repo/genui",
      rule: "shared-ui-no-genui",
    };
  }

  if (uiForbiddenModules.has(specifier)) {
    return {
      expected:
        "@repo/ui must not import server-only or GenUI modules into shared UI",
      rule: "shared-ui-forbidden-module",
    };
  }

  for (const prefix of serverOnlyModulePrefixes) {
    if (specifier === prefix || specifier.startsWith(`${prefix}/`)) {
      return {
        expected: "@repo/ui must not import Next.js server request APIs",
        rule: "shared-ui-no-server-apis",
      };
    }
  }

  return null;
}

function violatesGenuiImport({ specifier }) {
  if (isAppAlias(specifier) || isAppPathImport(specifier)) {
    return {
      expected:
        "@repo/genui must remain independent from apps/web application source",
      rule: "genui-no-app-imports",
    };
  }

  return null;
}

function violatesDeepPackageImport({ specifier }) {
  if (
    specifier.startsWith("@repo/ui/src/") ||
    specifier.startsWith("@repo/genui/src/")
  ) {
    return {
      expected:
        "Use declared package exports instead of deep @repo/*/src/ paths",
      rule: "no-deep-package-imports",
    };
  }

  return null;
}

function validateUiPackage(root, violations) {
  const directory = path.join(root, uiSourceRoot);

  for (const absolute of walkSourceFiles(directory)) {
    const relative = relativeFromRoot(absolute, root);
    const sourceFile = parseSourceFile(absolute);

    for (const { isTypeOnly, specifier } of collectModuleSpecifiers(
      sourceFile
    )) {
      if (isTypeOnly) {
        continue;
      }

      const violation = violatesUiImport({ specifier });

      if (violation) {
        violations.push({
          ...violation,
          import: specifier,
          path: relative,
        });
      }
    }
  }
}

function validateGenuiPackage(root, violations) {
  const directory = path.join(root, genuiSourceRoot);

  for (const absolute of walkSourceFiles(directory)) {
    const relative = relativeFromRoot(absolute, root);
    const sourceFile = parseSourceFile(absolute);

    for (const { specifier } of collectModuleSpecifiers(sourceFile)) {
      const violation = violatesGenuiImport({ specifier });

      if (violation) {
        violations.push({
          ...violation,
          import: specifier,
          path: relative,
        });
      }
    }
  }
}

function validateClientSecurityBoundary(root, violations) {
  const directory = path.join(root, webAppRoot);

  for (const absolute of walkSourceFiles(directory)) {
    if (!hasTopLevelUseClient(absolute)) continue;
    const relative = relativeFromRoot(absolute, root);
    const sourceFile = parseSourceFile(absolute);

    for (const { isTypeOnly, specifier } of collectModuleSpecifiers(
      sourceFile
    )) {
      if (isTypeOnly) continue;
      if (
        specifier.startsWith("@/lib/security/") ||
        specifier.includes("/lib/security/")
      ) {
        violations.push({
          expected: "Client Components must not import server security helpers",
          import: specifier,
          path: relative,
          rule: "client-no-server-security",
        });
      }
    }
  }
}

function validateWebImports(root, violations) {
  const directory = path.join(root, webAppRoot);

  for (const absolute of walkSourceFiles(directory)) {
    const relative = relativeFromRoot(absolute, root);
    const sourceFile = parseSourceFile(absolute);

    for (const { specifier } of collectModuleSpecifiers(sourceFile)) {
      const violation = violatesDeepPackageImport({ specifier });

      if (violation) {
        violations.push({
          ...violation,
          import: specifier,
          path: relative,
        });
      }
    }
  }
}

function hasTopLevelUseClient(absolutePath) {
  const sourceFile = parseSourceFile(absolutePath);

  for (const statement of sourceFile.statements) {
    if (
      ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression) &&
      statement.expression.text === "use client"
    ) {
      return true;
    }

    if (
      !ts.isImportDeclaration(statement) &&
      !ts.isImportEqualsDeclaration(statement) &&
      !ts.isEmptyStatement(statement)
    ) {
      break;
    }
  }

  return false;
}

function validateRootLayout(root, violations) {
  const layoutPath = path.join(root, rootLayoutRelative);

  if (!existsSync(layoutPath)) {
    return;
  }

  if (hasTopLevelUseClient(layoutPath)) {
    violations.push({
      expected: "apps/web/app/layout.tsx must remain a Server Component",
      import: '"use client"',
      path: rootLayoutRelative,
      rule: "server-first-root-layout",
    });
  }
}

function readPackageJson(absolutePath) {
  return JSON.parse(readFileSync(absolutePath, "utf-8"));
}

function workspacePackageNames(root) {
  const names = new Map();
  const workspaceRoots = [
    ...walkPackageJsonRoots(path.join(root, "apps")),
    ...walkPackageJsonRoots(path.join(root, "packages")),
  ];

  for (const packageRoot of workspaceRoots) {
    const manifest = readPackageJson(path.join(packageRoot, "package.json"));
    names.set(manifest.name, packageRoot);
  }

  return names;
}

function walkPackageJsonRoots(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const roots = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageRoot = path.join(directory, entry.name);
    if (existsSync(path.join(packageRoot, "package.json"))) {
      roots.push(packageRoot);
    }
  }

  return roots;
}

function workspaceDependencies(manifest) {
  const sections = [
    manifest.dependencies,
    manifest.devDependencies,
    manifest.peerDependencies,
  ];

  const deps = new Set();

  for (const section of sections) {
    if (!section) {
      continue;
    }

    for (const [name, version] of Object.entries(section)) {
      if (typeof version === "string" && version.startsWith("workspace:")) {
        deps.add(name);
      }
    }
  }

  return deps;
}

function detectWorkspaceCycles(graph) {
  const cycles = [];
  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  const visit = (node) => {
    if (visiting.has(node)) {
      const cycleStart = stack.indexOf(node);
      cycles.push([...stack.slice(cycleStart), node]);
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visiting.add(node);
    stack.push(node);

    for (const neighbor of graph.get(node) ?? []) {
      visit(neighbor);
    }

    stack.pop();
    visiting.delete(node);
    visited.add(node);
  };

  for (const node of graph.keys()) {
    visit(node);
  }

  return cycles;
}

function validatePackageGraph(root, violations) {
  const packageNames = workspacePackageNames(root);
  const graph = new Map();

  for (const [name, packageRoot] of packageNames) {
    const manifest = readPackageJson(path.join(packageRoot, "package.json"));
    const deps = workspaceDependencies(manifest);
    graph.set(name, [...deps]);

    const relative = relativeFromRoot(packageRoot, root);

    if (relative.startsWith("packages/") && deps.has("web")) {
      violations.push({
        expected: "Shared packages must not depend on the Next.js application",
        import: "web",
        path: path.join(relative, "package.json"),
        rule: "shared-package-no-app-dependency",
      });
    }
  }

  for (const cycle of detectWorkspaceCycles(graph)) {
    violations.push({
      expected: "Workspace package dependency graph must be acyclic",
      import: cycle.join(" -> "),
      path: "workspace package.json manifests",
      rule: "workspace-dependency-cycle",
    });
  }
}

export function validateReactArchitecture(root = repositoryRoot) {
  const violations = [];

  validateUiPackage(root, violations);
  validateGenuiPackage(root, violations);
  validateWebImports(root, violations);
  validateClientSecurityBoundary(root, violations);
  validateRootLayout(root, violations);
  validatePackageGraph(root, violations);

  return violations;
}

function formatViolations(violations) {
  return violations.map(
    (violation) =>
      `${violation.path}: [${violation.rule}] import ${violation.import} — ${violation.expected}`
  );
}

const entrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (import.meta.url === entrypoint) {
  const violations = validateReactArchitecture();

  if (violations.length > 0) {
    console.error("React architecture validation failed:\n");

    for (const line of formatViolations(violations)) {
      console.error(`- ${line}`);
    }

    console.error("\nSee ADR 0009 and ARCHITECTURE.md for boundaries.");

    process.exitCode = 1;
  } else {
    console.log("React architecture boundaries: OK");
  }
}
