import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ASSESSMENT_HANDOFF = ".agents/flow/operations/assessment-adoption.md";
const INSTALL_SCRIPT_REL = ".agents/tooling/setup/install.sh";
const PRODUCT_README_TEMPLATE_REL =
  ".agents/tooling/setup/product-readme.template.md";
const HOST_FROM = "web.localhost";

const INSTALLER_ONLY_PATHS = [
  INSTALL_SCRIPT_REL,
  ".agents/tooling/setup/product-adoption.mjs",
  ".agents/tooling/setup/product-adoption.test.mjs",
  ".agents/tooling/setup/clean-adoption.test.mjs",
  ".agents/tooling/setup/run-install-tests-if-present.mjs",
  ".agents/tooling/setup/install.test.mjs",
  ".agents/tooling/setup/local-install-source.mjs",
  PRODUCT_README_TEMPLATE_REL,
  ".agents/eval/src/assessment/run.test.ts",
  "CLAUDE.md",
  "docs/adr/0002-feature-intelligence-product.md",
  "docs/initiatives/feature-intelligence.md",
  "knip.factory.json",
];

const ADOPTED_TOOLING_TEST =
  "node --test tooling/worktrees/*.test.mjs ../tooling/security/*.test.mjs ../tooling/checks/check-staged.test.mjs tooling/checks/conventional-commit.test.mjs tooling/setup/prompt-log.test.mjs";

export const PORTLESS_RESERVED = new Set([
  "run",
  "get",
  "alias",
  "hosts",
  "list",
  "doctor",
  "trust",
  "clean",
  "prune",
  "proxy",
  "service",
]);

export const slugify = (input) => {
  const slug = input
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll(/[^a-z0-9-]/gu, "")
    .replaceAll(/^-+|-+$/gu, "");
  return slug;
};

export const isReservedPortlessName = (name) => PORTLESS_RESERVED.has(name);

const hasControlCharacters = (value) => {
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code !== undefined && (code <= 0x1f || code === 0x7f)) return true;
  }
  return false;
};

export const validateProjectName = (projectName) => {
  const trimmed = projectName.trim();
  if (!trimmed) throw new Error("product-adoption: empty project name");
  if (hasControlCharacters(projectName))
    throw new Error(
      "product-adoption: project name contains control characters"
    );
  const slug = slugify(projectName);
  if (!slug)
    throw new Error(
      "product-adoption: project name must slugify to a non-empty slug"
    );
  if (isReservedPortlessName(slug))
    throw new Error(`product-adoption: slug "${slug}" is reserved by portless`);
  return { slug, trimmed };
};

const replaceInFile = ({ filePath, from, to }) => {
  if (!existsSync(filePath))
    throw new Error(`product-adoption: missing file ${filePath}`);
  const content = readFileSync(filePath, "utf-8");
  writeFileSync(filePath, content.replaceAll(from, to), "utf-8");
};

const setJsonStringField = ({ filePath, key, value }) => {
  if (!existsSync(filePath))
    throw new Error(`product-adoption: missing file ${filePath}`);
  const lines = readFileSync(filePath, "utf-8").split("\n");
  const pattern = new RegExp(`^\\s*"${key}":\\s*"`, "u");
  const next = lines.map((line) =>
    pattern.test(line) ? `  "${key}": "${value}",` : line
  );
  writeFileSync(filePath, `${next.join("\n")}\n`, "utf-8");
};

const setPortlessName = ({ filePath, name }) => {
  if (!existsSync(filePath))
    throw new Error(`product-adoption: missing file ${filePath}`);
  const content = readFileSync(filePath, "utf-8");
  const next = content.replace(
    /("portless":\s*\{[^}]*"name":\s*")[^"]+(")/su,
    `$1${name}$2`
  );
  writeFileSync(filePath, next, "utf-8");
};

const removeIfExists = (root, relative) => {
  const target = path.join(root, relative);
  if (!existsSync(target)) return;
  rmSync(target, { force: true, recursive: true });
};

const renderProductReadme = ({ displayName, slug, root }) => {
  const templatePath = path.join(root, PRODUCT_README_TEMPLATE_REL);
  if (!existsSync(templatePath))
    throw new Error("product-adoption: missing product README template");
  const template = readFileSync(templatePath, "utf-8");
  return template
    .replaceAll("{{displayName}}", displayName)
    .replaceAll("{{slug}}", slug);
};

const customizeProductDoc = ({ displayName, root }) => {
  const productPath = path.join(root, "PRODUCT.md");
  if (!existsSync(productPath))
    throw new Error("product-adoption: missing PRODUCT.md");
  let content = readFileSync(productPath, "utf-8");
  content = content.replace(
    /^# Web Starter — Product$/mu,
    `# ${displayName} — Product`
  );
  content = content.replace(
    /Provide the starting application for a product built with Flow Factory\./u,
    `Provide the starting application for ${displayName}, built with Flow Factory.`
  );
  writeFileSync(productPath, content, "utf-8");
};

const customizeArchitectureDoc = ({ root }) => {
  const archPath = path.join(root, "ARCHITECTURE.md");
  if (!existsSync(archPath)) return;
  let content = readFileSync(archPath, "utf-8");
  content = content.replace(
    /\[PRODUCT\.md\]\(PRODUCT\.md\) and \[DESIGN\.md\]\(DESIGN\.md\) are adopter-owned templates\./u,
    "[PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) are progressively maintained product contracts."
  );
  writeFileSync(archPath, content, "utf-8");
};

const patchAgentsPackageJson = (root) => {
  const pkgPath = path.join(root, ".agents/package.json");
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.scripts["test:tooling"] = ADOPTED_TOOLING_TEST;
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
};

const removeKnipFactoryScript = (root) => {
  const pkgPath = path.join(root, "package.json");
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  if (pkg.scripts?.["knip:factory"]) {
    delete pkg.scripts["knip:factory"];
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
  }
};

const assertAdoptedConsistency = (root) => {
  const agentsPkgPath = path.join(root, ".agents/package.json");
  if (!existsSync(agentsPkgPath)) return;
  const pkg = JSON.parse(readFileSync(agentsPkgPath, "utf-8"));
  const tooling = pkg.scripts?.["test:tooling"] ?? "";
  for (const forbidden of [
    "product-adoption.test.mjs",
    "clean-adoption.test.mjs",
    "run-install-tests-if-present.mjs",
    "install.test.mjs",
  ]) {
    if (tooling.includes(forbidden))
      throw new Error(
        `product-adoption: test:tooling still references removed file ${forbidden}`
      );
  }
  for (const relative of INSTALLER_ONLY_PATHS) {
    if (existsSync(path.join(root, relative)))
      throw new Error(
        `product-adoption: installer artifact still present: ${relative}`
      );
  }
};

export const applyProductAdoption = ({ projectName, root }) => {
  const { slug, trimmed: displayName } = validateProjectName(projectName);
  const hostTo = `${slug}.localhost`;

  replaceInFile({
    filePath: path.join(root, "apps/web/next.config.ts"),
    from: HOST_FROM,
    to: hostTo,
  });
  replaceInFile({
    filePath: path.join(root, "apps/web/AGENTS.md"),
    from: HOST_FROM,
    to: hostTo,
  });

  writeFileSync(
    path.join(root, "README.md"),
    renderProductReadme({ displayName, root, slug }),
    "utf-8"
  );

  setJsonStringField({
    filePath: path.join(root, "package.json"),
    key: "name",
    value: slug,
  });
  setPortlessName({
    filePath: path.join(root, "apps/web/package.json"),
    name: slug,
  });

  customizeProductDoc({ displayName, root });
  customizeArchitectureDoc({ root });

  removeIfExists(root, ".agents/eval/fixtures/assessments");
  removeIfExists(root, ASSESSMENT_HANDOFF);
  for (const relative of INSTALLER_ONLY_PATHS) removeIfExists(root, relative);

  removeIfExists(root, "prompts.txt");
  mkdirSync(path.join(root, ".agents/flow"), { recursive: true });
  writeFileSync(path.join(root, ".agents/flow/prompts.txt"), "", "utf-8");

  patchAgentsPackageJson(root);
  removeKnipFactoryScript(root);
  assertAdoptedConsistency(root);

  return { host: hostTo, slug };
};

const parseArgs = (argv) => {
  const args = { command: argv[0] };
  for (let i = 1; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--root") {
      i += 1;
      args.root = argv[i];
    } else if (token === "--project-name") {
      i += 1;
      args.projectName = argv[i];
    } else if (token === "apply" || token === "slugify" || token === "validate")
      args.command = token;
  }
  return args;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "slugify") {
    process.stdout.write(`${slugify(args.projectName ?? "")}\n`);
    return;
  }
  if (args.command === "validate") {
    if (!args.projectName) {
      console.error(
        "usage: product-adoption.mjs validate --project-name <name>"
      );
      process.exit(1);
    }
    try {
      const { slug, trimmed } = validateProjectName(args.projectName);
      process.stdout.write(`${JSON.stringify({ slug, trimmed })}\n`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
    return;
  }
  if (args.command !== "apply" || !args.root || !args.projectName) {
    console.error(
      "usage: product-adoption.mjs apply --root <path> --project-name <name> | validate --project-name <name>"
    );
    process.exit(1);
  }
  try {
    const result = applyProductAdoption({
      projectName: args.projectName,
      root: path.resolve(args.root),
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};

const isMainModule = () => {
  const entry = process.argv[1];
  if (!entry) return false;
  const invoked = path.resolve(entry);
  const modulePath = path.resolve(import.meta.filename);
  try {
    return realpathSync(invoked) === realpathSync(modulePath);
  } catch {
    return invoked === modulePath;
  }
};

if (isMainModule()) main();
