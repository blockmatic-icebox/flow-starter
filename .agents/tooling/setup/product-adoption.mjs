import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const ASSESSMENT_HANDOFF = ".agents/flow/operations/assessment-adoption.md";
const INSTALL_SCRIPT_REL = ".agents/tooling/setup/install.sh";
const HOST_FROM = "web.localhost";

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

export const applyProductAdoption = ({ projectName, root }) => {
  const slug = slugify(projectName);
  if (!projectName.trim())
    throw new Error("product-adoption: empty project name");
  if (!slug) throw new Error("product-adoption: project name must slugify");
  if (isReservedPortlessName(slug))
    throw new Error(`product-adoption: slug "${slug}" is reserved by portless`);

  const hostTo = `${slug}.localhost`;

  removeIfExists(root, ".agents/eval/fixtures/assessments");
  removeIfExists(root, ASSESSMENT_HANDOFF);
  removeIfExists(root, INSTALL_SCRIPT_REL);
  removeIfExists(root, ".agents/tooling/setup/product-adoption.mjs");
  removeIfExists(root, ".agents/tooling/setup/product-adoption.test.mjs");
  removeIfExists(
    root,
    ".agents/tooling/setup/run-install-tests-if-present.mjs"
  );
  removeIfExists(root, ".agents/tooling/setup/install.test.mjs");
  removeIfExists(root, ".agents/eval/src/assessment/run.test.ts");
  removeIfExists(root, "CLAUDE.md");
  removeIfExists(root, "docs/adr/0002-feature-intelligence-product.md");
  removeIfExists(root, "docs/initiatives/feature-intelligence.md");
  removeIfExists(root, "knip.factory.json");

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

  const readmePath = path.join(root, "README.md");
  if (existsSync(readmePath)) {
    const readme = readFileSync(readmePath, "utf-8");
    writeFileSync(
      readmePath,
      readme.replace(/^# Project Name$/mu, `# ${projectName}`),
      "utf-8"
    );
  }

  setJsonStringField({
    filePath: path.join(root, "package.json"),
    key: "name",
    value: slug,
  });
  setPortlessName({
    filePath: path.join(root, "apps/web/package.json"),
    name: slug,
  });

  const uninitializedProduct = `# Product (not initialized)

This repository has not established a product contract yet.

When Explore produces meaningful material, create \`PRODUCT.md\` from \`.agents/skills/flow/templates/PRODUCT.md\`.
`;
  const uninitializedDesign = `# Design (not initialized)

Create or update \`DESIGN.md\` during Explore when visual references or interaction direction emerge; a user journey is not required. Template: \`.agents/skills/flow/templates/DESIGN.md\`.
`;
  writeFileSync(path.join(root, "PRODUCT.md"), uninitializedProduct, "utf-8");
  writeFileSync(path.join(root, "DESIGN.md"), uninitializedDesign, "utf-8");

  removeIfExists(root, "prompts.txt");
  mkdirSync(path.join(root, ".agents/flow"), { recursive: true });
  writeFileSync(path.join(root, ".agents/flow/prompts.txt"), "", "utf-8");

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
    } else if (token === "apply" || token === "slugify") args.command = token;
  }
  return args;
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "slugify") {
    process.stdout.write(`${slugify(args.projectName ?? "")}\n`);
    return;
  }
  if (args.command !== "apply" || !args.root || !args.projectName) {
    console.error(
      "usage: product-adoption.mjs apply --root <path> --project-name <name>"
    );
    process.exit(1);
  }
  const result = applyProductAdoption({
    projectName: args.projectName,
    root: path.resolve(args.root),
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
};

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isMain) main();
