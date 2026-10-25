import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { repoRoot as repositoryRoot } from "../lib/repo-paths.mjs";
import { validateRepositoryOwnership } from "./check-repository-ownership.mjs";

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
  ["docs/adr", decisionFilePattern, "product-adr"],
  ["docs/pdr", decisionFilePattern, "product-pdr"],
  [".agents/flow/initiatives", slugFilePattern, "flow-initiatives"],
  [".agents/flow/research", researchFilePattern, "flow-research"],
  [".agents/flow/specs", slugFilePattern, "flow-specs"],
  [".agents/flow/decisions/adr", decisionFilePattern, "factory-adr"],
  [".agents/flow/decisions/pdr", decisionFilePattern, "factory-pdr"],
];

export const knowledgeBundleSources = [
  ".agents/flow/flow.md",
  ".agents/flow/README.md",
  ".agents/flow/factory.md",
  ".agents/flow/architecture.md",
  "ARCHITECTURE.md",
  "AGENTS.md",
  ".agents/flow/operations/context.md",
  ".agents/flow/operations/verification.md",
  ".agents/flow/operations/skills.md",
  ".agents/flow/operations/worktrees.md",
  "PRODUCT.md",
];

const firstPartySkillIds = ["flow", "flow-eval", "flow-improve"];

const legacyFlowDocDirs = ["docs/workflow", "docs/agents"];

const methodologyPathDenylist = [/^docs\/workflow\//u, /^docs\/agents\//u];

const productContractsInFlowDenylist = [
  /^\.agents\/flow\/.*\/PRODUCT\.md$/u,
  /^\.agents\/flow\/.*\/ARCHITECTURE\.md$/u,
];

const obsoletePathPatterns = [
  { label: "apps/web/lib/security", pattern: /apps\/web\/lib\/security/u },
  { label: "apps/web/lib/genui", pattern: /apps\/web\/lib\/genui/u },
  { label: "apps/web/lib/consultant", pattern: /apps\/web\/lib\/consultant/u },
  {
    label: "nested docs/specs/genui/",
    pattern: /docs\/specs\/genui\//u,
  },
  {
    label: ".agents/flow/specs/genui.md (moved to Factory)",
    pattern: /docs\/specs\/genui\.md/u,
  },
  {
    label: ".agents/flow/factory.md (moved to Factory)",
    pattern: /docs\/readme\.md/u,
  },
  {
    label: ".agents/flow/security/security-model.md (moved to Factory)",
    pattern: /docs\/security\/security-model\.md/u,
  },
  { label: "docs/workflow", pattern: /docs\/workflow\//u },
  { label: "docs/agents", pattern: /docs\/agents\//u },
];

const migratedFactoryAdrBasenames = new Set([
  "0001-agentic-architecture.md",
  "0002-vercel-ai-sdk-for-tier-3.md",
  "0003-genui-openui-foundation.md",
  "0004-voice-delegates-to-eve.md",
  "0005-workspace-stays-at-dev.md",
  "0006-external-invocation-is-read-only.md",
  "0007-monorepo-vercel-stack.md",
  "0008-monorepo-turborepo-pnpm.md",
  "0009-react-nextjs-fractal-architecture.md",
  "0010-site-consultant-chat-and-mcp.md",
  "0011-api-and-agent-security-boundaries.md",
  "0012-flow-and-web-applications.md",
]);

const semanticAuthoritativeFiles = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "SECURITY.md",
  ".agents/flow/factory.md",
  ".agents/flow/architecture.md",
  ".agents/flow/security/security-model.md",
  ".agents/flow/specs/genui.md",
  ".agents/flow/flow.md",
];

const researchDatePattern =
  /^\*\*Research date:\*\*\s*(?<date>\d{4}-\d{2}-\d{2}|Unknown \(legacy\))\s*$/mu;
const lastReviewedPattern =
  /^\*\*Last reviewed:\*\*\s*(?<date>\d{4}-\d{2}-\d{2})\s*$/mu;
const researchStatusPattern =
  /^\*\*Status:\*\*\s*(?<status>Current|Historical|Exploratory)\s*$/mu;
const specStatusPattern =
  /^\*\*Status:\*\*\s*(?<status>Current|Historical|Draft)\s*$/mu;
const decisionHeaderDatePattern = /^Date:\s*(?<date>\d{4}-\d{2}-\d{2})\s*$/mu;
const decisionStatusPattern =
  /^\*\*Status:\*\*\s*(?<status>Proposed|Accepted|Deprecated|Superseded by ADR \d{4})\s*$/mu;

const decisionRequiredSections = [
  "## Context",
  "## Decision",
  "## Alternatives considered",
  "## Consequences",
  "## Related documents",
];

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

function validateDecisionRecord({ content, errors, relative }) {
  const headerDate = decisionHeaderDatePattern.exec(content);

  if (!headerDate) {
    errors.push(`${relative}: missing Date: YYYY-MM-DD header`);
  } else if (!validCalendarDate(headerDate.groups.date)) {
    errors.push(`${relative}: invalid Date: header calendar date`);
  }

  if (!decisionStatusPattern.test(content)) {
    errors.push(
      `${relative}: missing or invalid **Status:** (Proposed, Accepted, Superseded by ADR NNNN, or Deprecated)`
    );
  }

  for (const section of decisionRequiredSections) {
    if (!content.includes(`${section}\n`)) {
      errors.push(`${relative}: missing ${section} section`);
    }
  }
}

function validateDocumentMetadata(root) {
  const errors = [];

  for (const filename of markdownFiles(path.join(root, "docs/research"))) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateResearchMetadata({ content, errors, relative });
  }

  for (const filename of markdownFiles(
    path.join(root, ".agents/flow/research")
  )) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateResearchMetadata({ content, errors, relative });
  }

  for (const filename of markdownFiles(path.join(root, "docs/specs"))) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateSpecMetadata({ content, errors, relative });
  }

  for (const filename of markdownFiles(path.join(root, ".agents/flow/specs"))) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateSpecMetadata({ content, errors, relative });
  }

  for (const filename of markdownFiles(path.join(root, "docs/adr"))) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateDecisionRecord({ content, errors, relative });
  }

  for (const filename of markdownFiles(
    path.join(root, ".agents/flow/decisions/adr")
  )) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateDecisionRecord({ content, errors, relative });
  }

  for (const filename of markdownFiles(path.join(root, "docs/pdr"))) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateDecisionRecord({ content, errors, relative });
  }

  for (const filename of markdownFiles(
    path.join(root, ".agents/flow/decisions/pdr")
  )) {
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    validateDecisionRecord({ content, errors, relative });
  }

  return errors;
}

export const requiredDocuments = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  ".agents/flow/factory.md",
  ".agents/flow/architecture.md",
  ".agents/flow/README.md",
  ".agents/flow/flow.md",
];

const rootLinkDocuments = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "DESIGN.md",
  "PRODUCT.md",
  "README.md",
  "SECURITY.md",
];

function stripFencedCode(markdown) {
  const lines = markdown.split("\n");
  const kept = [];
  let fence = null;

  for (const line of lines) {
    const match = /^(?: {0,3})(?<mark>`{3,}|~{3,})/u.exec(line);
    if (match) {
      const mark = match.groups.mark[0];
      const size = match.groups.mark.length;
      if (!fence) {
        fence = { mark, size };
        continue;
      }
      if (fence.mark === mark && size >= fence.size) {
        fence = null;
        continue;
      }
    }
    if (!fence) kept.push(line);
  }

  return kept.join("\n");
}

function linkDestination(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("<")) {
    const end = trimmed.indexOf(">");
    return end === -1 ? trimmed.slice(1) : trimmed.slice(1, end);
  }
  return trimmed.split(/\s+/u)[0] ?? "";
}

function markdownDestinations(markdown) {
  const source = stripFencedCode(markdown);
  const destinations = [];
  const inline = /!?\[[^\]]*\]\((?<dest><[^>\n]+>|[^)\s]+)(?:\s+[^)]*)?\)/gu;
  for (const match of source.matchAll(inline))
    destinations.push(match.groups.dest);
  const references = /^\s*\[[^\]]+\]:\s*(?<dest>\S+)/gmu;
  for (const match of source.matchAll(references))
    destinations.push(match.groups.dest);
  return destinations;
}

function externalLink(target) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/iu.test(target);
}

function validateSemanticConsistency(root) {
  const errors = [];

  for (const relative of semanticAuthoritativeFiles) {
    const absolute = path.join(root, relative);
    if (!existsSync(absolute)) continue;

    const content = readFileSync(absolute, "utf-8");

    for (const { label, pattern } of obsoletePathPatterns) {
      if (pattern.test(content)) {
        errors.push(
          `${relative}: obsolete path reference (${label}); update to .agents/flow/specs/genui.md or current product paths`
        );
      }
    }

    if (/apps\/flow\//u.test(content)) {
      errors.push(
        `${relative}: references removed apps/flow; use apps/web and packages/* only`
      );
    }
  }

  if (existsSync(path.join(root, "apps/flow"))) {
    errors.push("apps/flow must not exist; web-only product layout");
  }

  if (existsSync(path.join(root, "packages/flow-eval"))) {
    errors.push(
      "packages/flow-eval must not exist; evaluation lives under .agents/eval"
    );
  }

  return errors;
}

function validateKnowledgeSnapshot() {
  return [];
}

function validateLegacyFlowDocDirs(root) {
  return legacyFlowDocDirs
    .filter((relative) => existsSync(path.join(root, relative)))
    .map(
      (relative) =>
        `legacy Flow documentation directory still present: ${relative}`
    );
}

function validateMethodologyPlacement(root) {
  const errors = [];
  for (const filename of markdownFiles(path.join(root, "docs"))) {
    const relative = relativePath(root, filename);
    if (methodologyPathDenylist.some((pattern) => pattern.test(relative)))
      errors.push(
        `${relative}: Flow methodology document must live under .agents/flow/`
      );
  }
  for (const filename of markdownFiles(path.join(root, ".agents/flow"))) {
    const relative = relativePath(root, filename);
    if (
      productContractsInFlowDenylist.some((pattern) => pattern.test(relative))
    )
      errors.push(
        `${relative}: product contract must not live under .agents/flow/`
      );
  }
  return errors;
}

function parseSkillFrontmatter(content) {
  const match = /^---\s*\n([\s\S]*?)\n---/u.exec(content);
  if (!match) return null;
  const nameMatch = /^name:\s*(?<name>[a-z0-9-]+)\s*$/mu.exec(match[1]);
  return nameMatch?.groups?.name ?? null;
}

function validateFirstPartySkills(root) {
  const errors = [];
  const seen = new Set();

  for (const skillId of firstPartySkillIds) {
    if (seen.has(skillId))
      errors.push(`duplicate first-party skill id ${skillId}`);
    seen.add(skillId);

    const skillDir = path.join(root, ".agents/skills", skillId);
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!existsSync(skillFile)) {
      errors.push(
        `missing first-party skill ${skillId} at .agents/skills/${skillId}/SKILL.md`
      );
      continue;
    }

    const content = readFileSync(skillFile, "utf-8");
    const name = parseSkillFrontmatter(content);
    if (name !== skillId)
      errors.push(
        `.agents/skills/${skillId}/SKILL.md: frontmatter name ${name ?? "missing"} !== ${skillId}`
      );

    const lockPath = path.join(root, "skills-lock.json");
    if (existsSync(lockPath)) {
      const lock = JSON.parse(readFileSync(lockPath, "utf-8"));
      const entry = lock.skills?.[skillId];
      if (!entry)
        errors.push(`skills-lock.json missing first-party skill ${skillId}`);
      else if (
        entry.sourceType === "local" &&
        !entry.source?.includes(`.agents/skills/${skillId}`)
      )
        errors.push(
          `skills-lock.json ${skillId} source should reference .agents/skills/${skillId}`
        );
    }
  }

  return errors;
}

function validateMarkdownLinks(root) {
  const errors = [];
  const files = [
    ...rootLinkDocuments.map((relative) => path.join(root, relative)),
    ...markdownFiles(path.join(root, "docs")),
    ...markdownFiles(path.join(root, ".agents/flow")),
    ...firstPartySkillIds.map((skillId) =>
      path.join(root, ".agents/skills", skillId, "SKILL.md")
    ),
  ];

  for (const filename of files) {
    if (!existsSync(filename)) continue;
    const relative = relativePath(root, filename);
    const content = readFileSync(filename, "utf-8");

    for (const rawDestination of markdownDestinations(content)) {
      const destination = linkDestination(rawDestination);
      if (
        !destination ||
        destination.startsWith("#") ||
        externalLink(destination)
      )
        continue;

      let decoded = destination;
      try {
        decoded = decodeURIComponent(destination);
      } catch {
        errors.push(`${relative}: broken link ${destination}`);
        continue;
      }

      const hash = decoded.search(/[?#]/u);
      const targetPath = hash === -1 ? decoded : decoded.slice(0, hash);
      if (!targetPath) continue;

      const absolute = path.resolve(path.dirname(filename), targetPath);
      if (!existsSync(absolute))
        errors.push(`${relative}: broken link ${destination}`);
    }
  }

  return errors;
}

function validateRequiredDocuments(root) {
  return requiredDocuments
    .filter((relative) => !existsSync(path.join(root, relative)))
    .map((relative) => `missing canonical document ${relative}`);
}

function validateFactoryAdrPlacement(root) {
  const errors = [];
  const productAdrDir = path.join(root, "docs/adr");

  if (!existsSync(productAdrDir)) {
    return errors;
  }

  for (const filename of markdownFiles(productAdrDir)) {
    const basename = path.basename(filename);

    if (migratedFactoryAdrBasenames.has(basename)) {
      errors.push(
        `${relativePath(root, filename)}: Factory ADR belongs under .agents/flow/decisions/adr/`
      );
    }
  }

  return errors;
}

const staleFactoryDocLinkPattern =
  /docs\/(?:adr\/(?:000[1-9]|00[1-9][0-9]|010|011|012|013)-(?:agentic|vercel|genui|voice|workspace|external|monorepo|react|site|api|flow)|pdr\/0001-agnostic|readme\.md|specs\/genui\.md|security\/security-model\.md)/u;

function validateStaleFactoryAdrLinks(root) {
  const errors = [];

  for (const relative of semanticAuthoritativeFiles) {
    const absolute = path.join(root, relative);
    if (!existsSync(absolute)) continue;

    const content = readFileSync(absolute, "utf-8");

    if (staleFactoryDocLinkPattern.test(content)) {
      errors.push(
        `${relative}: stale Factory documentation path; use .agents/flow/ canonical locations`
      );
    }
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
    "factory-adr": new Map(),
    "factory-pdr": new Map(),
    "product-adr": new Map(),
    "product-pdr": new Map(),
  };

  for (const document of documents) {
    const { category, directory, filename, relative, pattern } = document;

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

    if (
      (category === "research" || category === "flow-research") &&
      !validResearchFilenameDate(suffix)
    ) {
      errors.push(`${relative}: invalid ISO calendar date`);
      continue;
    }

    if (
      category === "product-adr" ||
      category === "factory-adr" ||
      category === "product-pdr" ||
      category === "factory-pdr"
    ) {
      const number = decisionNumber(filename);

      if (number === 0) {
        errors.push(`${relative}: invalid decision identifier`);
        continue;
      }

      const previous = numbers[category].get(number);

      if (previous) {
        errors.push(
          `${relative}: duplicate ${category} number ${String(number).padStart(4, "0")}, already used by ${previous}`
        );
      } else {
        numbers[category].set(number, relative);
      }
    }
  }

  errors.push(
    ...validateFactoryAdrPlacement(root),
    ...validateStaleFactoryAdrLinks(root),
    ...validateDocumentMetadata(root),
    ...validateRequiredDocuments(root),
    ...validateLegacyFlowDocDirs(root),
    ...validateMethodologyPlacement(root),
    ...validateFirstPartySkills(root),
    ...validateMarkdownLinks(root),
    ...validateSemanticConsistency(root),
    ...validateKnowledgeSnapshot(),
    ...validateRepositoryOwnership(root)
  );

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
      "\nSee .agents/flow/flow.md for canonical documentation conventions."
    );

    process.exitCode = 1;
  } else {
    console.log("Flow documentation conventions: OK");
  }
}
