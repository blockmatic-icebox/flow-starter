import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const slug = "[a-z0-9]+(?:-[a-z0-9]+)*";
const slugFilePattern = new RegExp(`^${slug}\\.md$`, "u");
const researchFilePattern = new RegExp(`^\\d{8}-${slug}\\.md$`, "u");
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
  "docs/specs/genui/inventory.md",
  "docs/specs/genui/readme.md",
]);

const researchDatePattern =
  /^\*\*Research date:\*\*\s*(?<date>\d{4}-\d{2}-\d{2}|Unknown \(legacy\))\s*$/mu;
const lastReviewedPattern =
  /^\*\*Last reviewed:\*\*\s*(?<date>\d{4}-\d{2}-\d{2})\s*$/mu;
const researchStatusPattern =
  /^\*\*Status:\*\*\s*(?<status>Current|Historical|Exploratory)\s*$/mu;
const specStatusPattern =
  /^\*\*Status:\*\*\s*(?<status>Current|Historical|Draft)\s*$/mu;
const decisionHeaderDatePattern = /^Date:\s*(?<date>\d{4}-\d{2}-\d{2})\s*$/mu;

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

function compactDateToIso(compactDate) {
  return `${compactDate.slice(0, 4)}-${compactDate.slice(4, 6)}-${compactDate.slice(6, 8)}`;
}

function validCalendarDate(dateString) {
  const date = new Date(`${dateString}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === dateString
  );
}

function validResearchFilenameDate(filename) {
  const match = /^(?<date>\d{8})-/u.exec(filename);

  if (!match) {
    return false;
  }

  return validCalendarDate(compactDateToIso(match.groups.date));
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

function validateResearchMetadata({ content, errors, relative }) {
  const researchDate = researchDatePattern.exec(content);

  if (!researchDate) {
    errors.push(`${relative}: missing **Research date:** metadata`);
  } else if (
    researchDate.groups.date !== "Unknown (legacy)" &&
    !validCalendarDate(researchDate.groups.date)
  ) {
    errors.push(`${relative}: invalid **Research date:** calendar date`);
  }

  const reviewed = lastReviewedPattern.exec(content);

  if (!reviewed) {
    errors.push(`${relative}: missing **Last reviewed:** metadata`);
  } else if (!validCalendarDate(reviewed.groups.date)) {
    errors.push(`${relative}: invalid **Last reviewed:** calendar date`);
  }

  if (!researchStatusPattern.test(content)) {
    errors.push(
      `${relative}: missing or invalid **Status:** (Current, Historical, or Exploratory)`
    );
  }

  const datedFilename = /^(?<date>\d{8})-/u.exec(path.basename(relative));

  if (
    datedFilename &&
    researchDate &&
    researchDate.groups.date !== "Unknown (legacy)"
  ) {
    const fileDate = compactDateToIso(datedFilename.groups.date);

    if (researchDate.groups.date !== fileDate) {
      errors.push(
        `${relative}: **Research date:** must match filename date ${fileDate}`
      );
    }
  }
}

function validateSpecMetadata({ content, errors, relative }) {
  const reviewed = lastReviewedPattern.exec(content);

  if (!reviewed) {
    errors.push(`${relative}: missing **Last reviewed:** metadata`);
  } else if (!validCalendarDate(reviewed.groups.date)) {
    errors.push(`${relative}: invalid **Last reviewed:** calendar date`);
  }

  if (!specStatusPattern.test(content)) {
    errors.push(
      `${relative}: missing or invalid **Status:** (Current, Historical, or Draft)`
    );
  }
}

function validateDecisionHeaderDate({ content, errors, relative }) {
  const headerDate = decisionHeaderDatePattern.exec(content);

  if (!headerDate) {
    errors.push(`${relative}: missing Date: YYYY-MM-DD header`);
    return;
  }

  if (!validCalendarDate(headerDate.groups.date)) {
    errors.push(`${relative}: invalid Date: header calendar date`);
  }
}

function validateDocumentMetadata(root) {
  const errors = [];

  for (const filename of markdownFiles(path.join(root, "docs/research"))) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateResearchMetadata({ content, errors, relative });
  }

  for (const filename of markdownFiles(path.join(root, "docs/specs"))) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateSpecMetadata({ content, errors, relative });
  }

  for (const filename of markdownFiles(path.join(root, "docs/adr"))) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateDecisionHeaderDate({ content, errors, relative });
  }

  for (const filename of markdownFiles(path.join(root, "docs/pdr"))) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateDecisionHeaderDate({ content, errors, relative });
  }

  return errors;
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

    if (category === "research" && !validResearchFilenameDate(suffix)) {
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

  errors.push(...validateDocumentMetadata(root));

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

    console.error(
      "\nSee docs/workflow/flow.md for canonical documentation conventions."
    );

    process.exitCode = 1;
  } else {
    console.log("Flow documentation conventions: OK");
  }
}
