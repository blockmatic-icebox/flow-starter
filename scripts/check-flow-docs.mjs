import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const slug = "[a-z0-9]+(?:-[a-z0-9]+)*";
const slugFilePattern = new RegExp(`^${slug}\\.md$`, "u");
const researchFilePattern = new RegExp(
  `^\\d{4}-\\d{2}-\\d{2}-${slug}\\.md$`,
  "u"
);
const decisionFilePattern = new RegExp(`^\\d{4}-${slug}\\.md$`, "u");

const rules = [
  ["docs/ideas", slugFilePattern, "ideas"],
  ["docs/initiatives", slugFilePattern, "initiatives"],
  ["docs/plans", slugFilePattern, "plans"],
  ["docs/specs", slugFilePattern, "specs"],
  ["docs/research", researchFilePattern, "research"],
  ["docs/adr", decisionFilePattern, "adr"],
  ["docs/pdr", decisionFilePattern, "pdr"],
];

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
  if (!existsSync(directory)) {
    return [];
  }

  const result = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      result.push(...markdownFiles(filename));
    } else if (entry.isFile() && /\.md$/iu.test(entry.name)) {
      result.push(filename);
    }
  }

  return result;
}

function relativePath(root, filename) {
  return path.relative(root, filename).split(path.sep).join("/");
}

function decisionNumber(filename) {
  const match = new RegExp(`^(?<num>\\d{3,4})-${slug}\\.md$`, "u").exec(
    path.basename(filename)
  );

  return match ? Number(match.groups.num) : null;
}

function validDate(filename) {
  const match = /^(?<date>\d{4}-\d{2}-\d{2})-/u.exec(filename);

  if (!match) {
    return false;
  }

  const date = new Date(`${match.groups.date}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === match.groups.date
  );
}

function seedLegacyDecisionNumbers({ numbers, root }) {
  for (const relative of legacyPaths) {
    if (!existsSync(path.join(root, relative))) {
      continue;
    }

    let category = null;

    if (relative.startsWith("docs/adr/")) {
      category = "adr";
    } else if (relative.startsWith("docs/pdr/")) {
      category = "pdr";
    }

    if (!category) {
      continue;
    }

    const number = decisionNumber(path.basename(relative));

    if (number !== null) {
      numbers[category].set(number, relative);
    }
  }
}

export function validateFlowDocs(root = repositoryRoot) {
  const errors = [];
  const documents = [];

  for (const [directory, pattern, category] of rules) {
    const fullDirectory = path.join(root, directory);

    for (const filename of markdownFiles(fullDirectory)) {
      documents.push({
        category,
        directory,
        filename,
        pattern,
        relative: relativePath(root, filename),
      });
    }
  }

  documents.sort((left, right) => left.relative.localeCompare(right.relative));

  const numbers = {
    adr: new Map(),
    pdr: new Map(),
  };

  seedLegacyDecisionNumbers({ numbers, root });

  for (const document of documents) {
    const { category, directory, filename, relative, pattern } = document;

    if (legacyPaths.has(relative)) {
      continue;
    }

    const suffix = relative.slice(directory.length + 1);

    if (suffix.includes("/")) {
      errors.push(
        `${relative}: nested Markdown documents are not allowed in ${directory}/`
      );
      continue;
    }

    if (!pattern.test(suffix)) {
      errors.push(`${relative}: invalid filename for ${directory}/`);
      continue;
    }

    if (category === "research" && !validDate(suffix)) {
      errors.push(`${relative}: invalid ISO calendar date`);
      continue;
    }

    if (category === "adr" || category === "pdr") {
      const number = decisionNumber(filename);

      if (number === 0) {
        errors.push(`${relative}: invalid decision identifier`);
        continue;
      }

      const previous = numbers[category].get(number);

      if (previous) {
        errors.push(
          `${relative}: duplicate ${category.toUpperCase()} number ${String(number).padStart(4, "0")}, already used by ${previous}`
        );
      } else {
        numbers[category].set(number, relative);
      }
    }
  }

  return errors;
}

const entrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (import.meta.url === entrypoint) {
  const errors = validateFlowDocs();

  if (errors.length > 0) {
    console.error("Flow documentation validation failed:\n");

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    console.error("\nSee FLOW.md for canonical documentation conventions.");

    process.exitCode = 1;
  } else {
    console.log("Flow documentation conventions: OK");
  }
}
