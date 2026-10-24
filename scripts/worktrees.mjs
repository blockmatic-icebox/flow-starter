#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repositoryRoot = path.resolve(import.meta.dirname, "..");

const PARENT_OWNED_WRITE_PATTERNS = [
  /^docs\/initiatives\//u,
  /^pnpm-lock\.yaml$/u,
  /^skills-lock\.json$/u,
  /knowledge-snapshot\.ts$/u,
];

export function loadSkillsLock(repositoryRootPath = repositoryRoot) {
  const raw = readFileSync(
    path.join(repositoryRootPath, "skills-lock.json"),
    "utf-8"
  );
  const parsed = JSON.parse(raw);
  return new Set(Object.keys(parsed.skills ?? {}));
}

export function initiativePath(slug, repositoryRootPath = repositoryRoot) {
  return path.join(repositoryRootPath, "docs/initiatives", `${slug}.md`);
}

function parseListBlock(lines, startIndex) {
  const items = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (/^ {2}-\s+/u.test(line)) {
      items.push(line.replace(/^ {2}-\s+/u, "").trim());
      index += 1;
      continue;
    }
    if (line.trim() === "" || /^####\s/u.test(line) || /^###\s/u.test(line)) {
      break;
    }
    break;
  }
  return { items, nextIndex: index };
}

function parseTaskProperty(task, lines, index) {
  const inner = lines[index];

  for (const key of ["mode", "flow_stage", "acceptance", "build_authorized"]) {
    const prefix = `- ${key}:`;
    if (inner.startsWith(prefix)) {
      task[key] = inner.slice(prefix.length).trim();
      return index + 1;
    }
  }

  for (const key of ["depends_on", "writes", "reads", "skills"]) {
    const prefix = `- ${key}:`;
    if (!inner.startsWith(prefix)) continue;

    const rest = inner.slice(prefix.length).trim();
    if (rest === "[]") {
      task[key] = [];
      return index + 1;
    }

    if (!rest) {
      const list = parseListBlock(lines, index + 1);
      task[key] = list.items;
      return list.nextIndex;
    }

    task[key] = [rest];
    return index + 1;
  }

  return null;
}

export function parseInitiativeWaves(markdown) {
  const wavesHeading = markdown.indexOf("\n## Waves");
  if (wavesHeading === -1) {
    return { waves: new Map() };
  }

  const body = markdown.slice(wavesHeading);
  const lines = body.split("\n");
  const waves = new Map();
  let currentWave = null;
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const waveMatch = /^### Wave\s+(.+)$/u.exec(line);
    if (waveMatch) {
      currentWave = waveMatch[1].trim();
      waves.set(currentWave, []);
      index += 1;
      continue;
    }

    const taskMatch = /^#### task:\s*(\S+)/u.exec(line);
    if (taskMatch && currentWave) {
      const task = { id: taskMatch[1], wave: currentWave };
      index += 1;

      while (index < lines.length) {
        const inner = lines[index];
        if (inner.startsWith("#### task:") || inner.startsWith("### Wave"))
          break;
        if (inner.startsWith("## ") && !inner.startsWith("### ")) break;

        const nextIndex = parseTaskProperty(task, lines, index);
        if (nextIndex !== null) {
          index = nextIndex;
          continue;
        }

        index += 1;
      }

      task.depends_on ??= [];
      task.writes ??= [];
      task.reads ??= [];
      task.skills ??= [];
      waves.get(currentWave).push(task);
      continue;
    }

    index += 1;
  }

  return { waves };
}

const normalizePath = (p) => p.replace(/\/$/u, "");

function pathsOverlap(a, b) {
  if (normalizePath(a) === normalizePath(b)) return true;
  const prefixA = `${normalizePath(a)}/`;
  const prefixB = `${normalizePath(b)}/`;
  return (
    normalizePath(a).startsWith(prefixB) || normalizePath(b).startsWith(prefixA)
  );
}

function validateTask(task, skillIds, errors) {
  if (!task.mode) errors.push(`task ${task.id}: missing mode`);
  if (!task.flow_stage) errors.push(`task ${task.id}: missing flow_stage`);

  for (const skill of task.skills) {
    if (!skillIds.has(skill)) {
      errors.push(`task ${task.id}: unknown skill "${skill}"`);
    }
  }

  if (task.mode === "build") {
    if (!task.acceptance) {
      errors.push(`task ${task.id}: build task missing acceptance`);
    }
    if (task.build_authorized !== "yes") {
      errors.push(`task ${task.id}: build task requires build_authorized: yes`);
    }
    for (const writePath of task.writes) {
      if (isParentOwnedWrite(writePath)) {
        errors.push(`task ${task.id}: parent-owned write path "${writePath}"`);
      }
    }
  }

  if (task.mode === "question" && task.writes.length > 0) {
    errors.push(`task ${task.id}: question mode must have empty writes`);
  }
}

function validateWaveWriteOverlap(waveName, writeSets, errors) {
  for (let i = 0; i < writeSets.length; i += 1) {
    for (let j = i + 1; j < writeSets.length; j += 1) {
      for (const a of writeSets[i].writes) {
        for (const b of writeSets[j].writes) {
          if (pathsOverlap(a, b)) {
            errors.push(
              `wave ${waveName}: write overlap between ${writeSets[i].id} and ${writeSets[j].id} (${a} ~ ${b})`
            );
          }
        }
      }
    }
  }
}

function validateDependencyGraph(tasksById, errors) {
  for (const [id, task] of tasksById) {
    for (const dep of task.depends_on) {
      if (!tasksById.has(dep)) {
        errors.push(`task ${id}: unknown dependency "${dep}"`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      errors.push(`dependency cycle involving ${id}`);
      return;
    }
    visiting.add(id);
    const task = tasksById.get(id);
    if (task) {
      for (const dep of task.depends_on) visit(dep);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of tasksById.keys()) visit(id);
}

function isParentOwnedWrite(writePath) {
  return PARENT_OWNED_WRITE_PATTERNS.some((pattern) => pattern.test(writePath));
}

export function validateWaves({ waves }, skillIds) {
  const errors = [];
  const tasksById = new Map();

  for (const [waveName, tasks] of waves) {
    const writeSets = [];

    for (const task of tasks) {
      if (tasksById.has(task.id)) {
        errors.push(`duplicate task id: ${task.id}`);
      }
      tasksById.set(task.id, { ...task, waveName });

      validateTask(task, skillIds, errors);
      writeSets.push({ id: task.id, writes: task.writes });
    }

    validateWaveWriteOverlap(waveName, writeSets, errors);
  }

  validateDependencyGraph(tasksById, errors);

  return errors;
}

export function loadAndValidateInitiative(
  slug,
  repositoryRootPath = repositoryRoot
) {
  const filePath = initiativePath(slug, repositoryRootPath);
  if (!existsSync(filePath)) {
    return { errors: [`missing initiative: ${filePath}`], ok: false };
  }
  const markdown = readFileSync(filePath, "utf-8");
  const parsed = parseInitiativeWaves(markdown);
  const skillIds = loadSkillsLock(repositoryRootPath);
  const errors = validateWaves(parsed, skillIds);
  return { errors, filePath, markdown, ok: errors.length === 0, parsed };
}

function renderBrief({ slug, task, initiativeRelative }) {
  return `# Worktree brief: ${task.id}

## Context

- Initiative slug: ${slug}
- Initiative: \`${initiativeRelative}\`
- Wave: ${task.wave}
- Task id: ${task.id}
- Flow stage: ${task.flow_stage}
- Mode: ${task.mode}

## Writes (only these paths)

${task.writes.length ? task.writes.map((p) => `- ${p}`).join("\n") : "- (none — read only)"}

## Reads

${task.reads.map((p) => `- ${p}`).join("\n")}

## Skills (load SKILL.md for each)

${task.skills.map((s) => `- ${s}`).join("\n")}

## Acceptance

${task.mode === "build" ? `\`${task.acceptance}\` must exit 0.` : "Return findings to the parent; do not edit canonical docs."}

## Return to parent

1. Files changed (if any)
2. Commands run with exit codes
3. Blockers or open questions
`;
}

function runGit(args, cwd = repositoryRoot) {
  execSync(["git", ...args].join(" "), { cwd, stdio: "inherit" });
}

function commandCheck(slug) {
  const result = loadAndValidateInitiative(slug);
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }
  const taskCount = [...result.parsed.waves.values()].reduce(
    (sum, tasks) => sum + tasks.length,
    0
  );
  console.log(
    `ok: ${slug} (${result.parsed.waves.size} wave(s), ${taskCount} task(s))`
  );
}

function commandUp(slug, waveName) {
  const result = loadAndValidateInitiative(slug);
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }

  const tasks = result.parsed.waves.get(waveName);
  if (!tasks?.length) {
    console.error(`unknown or empty wave: ${waveName}`);
    process.exit(1);
  }

  for (const task of tasks) {
    if (task.mode === "build" && task.build_authorized !== "yes") {
      console.error(`task ${task.id}: build not authorized`);
      process.exit(1);
    }
  }

  const worktreeRoot = path.join(repositoryRoot, ".worktrees", slug);
  const briefRoot = path.join(repositoryRoot, ".worktrees", "briefs", slug);
  mkdirSync(worktreeRoot, { recursive: true });
  mkdirSync(briefRoot, { recursive: true });

  const initiativeRelative = path.relative(repositoryRoot, result.filePath);

  for (const task of tasks) {
    const branch = `wt/${slug}/${task.id}`;
    const worktreePath = path.join(worktreeRoot, task.id);
    const briefPath = path.join(briefRoot, `${task.id}.md`);

    if (existsSync(worktreePath)) {
      console.error(`worktree already exists: ${worktreePath}`);
      process.exit(1);
    }

    runGit(["worktree", "add", "-b", branch, worktreePath, "HEAD"]);

    writeFileSync(
      briefPath,
      renderBrief({ initiativeRelative, slug, task }),
      "utf-8"
    );
    console.log(`created ${worktreePath}`);
    console.log(`brief ${briefPath}`);
  }
}

function commandDown(slug, waveName) {
  const result = loadAndValidateInitiative(slug);
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }

  const tasks = result.parsed.waves.get(waveName);
  if (!tasks?.length) {
    console.error(`unknown or empty wave: ${waveName}`);
    process.exit(1);
  }

  for (const task of tasks) {
    const worktreePath = path.join(repositoryRoot, ".worktrees", slug, task.id);
    if (!existsSync(worktreePath)) {
      console.warn(`skip missing worktree: ${worktreePath}`);
      continue;
    }
    runGit(["worktree", "remove", worktreePath, "--force"]);
    const branch = `wt/${slug}/${task.id}`;
    try {
      runGit(["branch", "-D", branch]);
    } catch {
      // branch may already be gone
    }
    console.log(`removed ${worktreePath}`);
  }
}

function main() {
  const [command, slug, waveName] = process.argv.slice(2);

  if (!command || !slug) {
    console.error(
      "usage: worktrees.mjs <check|up|down> <initiative-slug> [wave-name]"
    );
    process.exit(1);
  }

  if (command === "check") {
    commandCheck(slug);
    return;
  }

  if (!waveName) {
    console.error("up/down require a wave name");
    process.exit(1);
  }

  if (command === "up") commandUp(slug, waveName);
  else if (command === "down") commandDown(slug, waveName);
  else {
    console.error(`unknown command: ${command}`);
    process.exit(1);
  }
}

const entrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (import.meta.url === entrypoint) {
  main();
}
