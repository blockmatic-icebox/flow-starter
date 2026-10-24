import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const slug = "[a-z0-9]+(?:-[a-z0-9]+)*";

const rules = [
  ["docs/ideas", new RegExp(`^${slug}\\.md$`, "u")],
  ["docs/initiatives", new RegExp(`^${slug}\\.md$`, "u")],
  ["docs/plans", new RegExp(`^${slug}\\.md$`, "u")],
  ["docs/specs", new RegExp(`^${slug}\\.md$`, "u")],
  ["docs/research", new RegExp(`^\\d{4}-\\d{2}-\\d{2}-${slug}\\.md$`, "u")],
  ["docs/adr", new RegExp(`^\\d{4}-${slug}\\.md$`, "u")],
  ["docs/pdr", new RegExp(`^\\d{4}-${slug}\\.md$`, "u")],
];

// Existing documents in the starter. These exceptions allow adoption
// without an unrelated migration. Do not expand for newly created files.
const legacyPaths = new Set([
  "docs/adr/001-use-flow-starter.md",
  "docs/adr/002-vercel-ai-sdk-for-tier-3.md",
  "docs/adr/003-genui-openui-foundation.md",
  "docs/adr/004-voice-delegates-to-eve.md",
  "docs/adr/005-workspace-stays-at-dev.md",
  "docs/adr/006-external-invocation-is-read-only.md",
  "docs/research/generative-ui.md",
  "docs/research/voice-surfaces.md",
  "docs/specs/genui/INVENTORY.md",
  "docs/specs/genui/README.md",
]);

function markdownFiles(directory) {
  if (!existsSync(directory)) return [];

  const found = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const location = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      found.push(...markdownFiles(location));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      found.push(location);
    }
  }

  return found;
}

function relativePath(filename) {
  return path.relative(root, filename).split(path.sep).join("/");
}

const errors = [];
const decisionNumbers = {
  adr: new Map(),
  pdr: new Map(),
};

for (const [directory, pattern] of rules) {
  const absoluteDirectory = path.join(root, directory);
  const category = path.basename(directory);

  for (const filename of markdownFiles(absoluteDirectory)) {
    const relative = relativePath(filename);

    if (legacyPaths.has(relative)) continue;

    const suffix = relative.slice(directory.length + 1);

    if (suffix.includes("/")) {
      errors.push(
        `${relative}: nested Markdown document; use a flat canonical filename in ${directory}/`
      );
      continue;
    }

    if (!pattern.test(suffix)) {
      errors.push(`${relative}: invalid filename for ${directory}/`);
      continue;
    }

    if (category === "adr" || category === "pdr") {
      const identifier = suffix.slice(0, 4);
      const previous = decisionNumbers[category].get(identifier);

      if (previous) {
        errors.push(
          `${relative}: duplicate decision number ${identifier}, already used by ${previous}`
        );
      } else {
        decisionNumbers[category].set(identifier, relative);
      }
    }
  }
}

if (errors.length > 0) {
  console.error("Flow documentation validation failed:\n");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  console.error("\nSee FLOW.md for canonical paths and naming conventions.");

  process.exitCode = 1;
} else {
  console.log("Flow documentation conventions: OK");
}
