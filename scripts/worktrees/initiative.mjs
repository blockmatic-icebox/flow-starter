import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { isDbSchemaPath, isParentOwnedWrite } from "./constants.mjs";
import {
  normalizeRepoPath,
  parseInlineList,
  pathsOverlap,
  validateSlug,
  validateTaskId,
} from "./paths.mjs";

export function loadSkillsLock(repositoryRootPath) {
  const raw = readFileSync(
    path.join(repositoryRootPath, "skills-lock.json"),
    "utf-8"
  );
  const parsed = JSON.parse(raw);
  return new Set(Object.keys(parsed.skills ?? {}));
}

export function initiativePath(slug, repositoryRootPath) {
  const slugError = validateSlug(slug);
  if (slugError) throw new Error(slugError);
  const product = path.join(
    repositoryRootPath,
    "docs/initiatives",
    `${slug}.md`
  );
  const flow = path.join(
    repositoryRootPath,
    ".agents/flow/initiatives",
    `${slug}.md`
  );
  if (existsSync(product) && existsSync(flow))
    throw new Error(
      `duplicate initiative slug ${slug}: docs/initiatives and .agents/flow/initiatives`
    );
  if (existsSync(flow)) return flow;
  return product;
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
    if (line.trim() === "" || /^####\s/u.test(line) || /^###\s/u.test(line))
      break;
    break;
  }
  return { items, nextIndex: index };
}

function parseTaskProperty(task, lines, index) {
  const inner = lines[index];

  for (const key of [
    "mode",
    "flow_stage",
    "acceptance",
    "build_authorized",
    "schema_owner",
  ]) {
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

    if (rest.startsWith("[")) {
      const parsed = parseInlineList(rest);
      if (parsed.error) {
        task._parseErrors ??= [];
        task._parseErrors.push(`${task.id}: ${key}: ${parsed.error}`);
        task[key] = [];
        return index + 1;
      }
      task[key] = parsed.items;
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
  let wavesStart = -1;
  if (wavesHeading !== -1) wavesStart = wavesHeading + 1;
  else if (markdown.startsWith("## Waves")) wavesStart = 0;
  if (wavesStart === -1) return { waves: new Map() };

  const body = markdown.slice(wavesStart);
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

function tasksReachableFrom(startId, tasksById) {
  const deps = new Set();
  const visit = (id) => {
    const task = tasksById.get(id);
    if (!task) return;
    for (const dep of task.depends_on) {
      if (!deps.has(dep)) {
        deps.add(dep);
        visit(dep);
      }
    }
  };
  visit(startId);
  return deps;
}

function validateTask(task, skillIds, errors, schemaOwners) {
  const idError = validateTaskId(task.id);
  if (idError) errors.push(idError);

  for (const msg of task._parseErrors ?? []) errors.push(msg);

  if (!task.mode) errors.push(`task ${task.id}: missing mode`);
  if (!task.flow_stage) errors.push(`task ${task.id}: missing flow_stage`);

  for (const skill of task.skills) {
    if (!skillIds.has(skill))
      errors.push(`task ${task.id}: unknown skill "${skill}"`);
  }

  for (const writePath of task.writes) {
    const normalized = normalizeRepoPath(writePath);
    if (normalized.error) {
      errors.push(`task ${task.id}: ${normalized.error}`);
      continue;
    }
  }

  if (task.mode === "build") {
    if (!task.acceptance)
      errors.push(`task ${task.id}: build task missing acceptance`);
    if (task.build_authorized !== "yes")
      errors.push(`task ${task.id}: build task requires build_authorized: yes`);

    for (const writePath of task.writes) {
      if (isParentOwnedWrite(writePath))
        errors.push(`task ${task.id}: parent-owned write path "${writePath}"`);

      if (isDbSchemaPath(writePath)) {
        if (task.schema_owner === "yes") {
          schemaOwners.push(task.id);
        } else {
          errors.push(
            `task ${task.id}: packages/db path requires schema_owner: yes`
          );
        }
      }
    }
  }

  if (task.mode === "question" && task.writes.length > 0)
    errors.push(`task ${task.id}: question mode must have empty writes`);
}

function validateWaveWriteOverlap(waveName, writeSets, errors) {
  for (let i = 0; i < writeSets.length; i += 1) {
    for (let j = i + 1; j < writeSets.length; j += 1) {
      for (const a of writeSets[i].writes) {
        for (const b of writeSets[j].writes) {
          if (pathsOverlap(a, b))
            errors.push(
              `wave ${waveName}: write overlap between ${writeSets[i].id} and ${writeSets[j].id} (${a} ~ ${b})`
            );
        }
      }
    }
  }
}

function validateConcurrentWriteOverlap(tasksById, errors) {
  const ids = [...tasksById.keys()];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const a = tasksById.get(ids[i]);
      const b = tasksById.get(ids[j]);
      const aReach = tasksReachableFrom(a.id, tasksById);
      const bReach = tasksReachableFrom(b.id, tasksById);
      const ordered = aReach.has(b.id) || bReach.has(a.id) || ids[i] === ids[j];
      if (ordered) continue;
      for (const writeA of a.writes) {
        for (const writeB of b.writes) {
          if (pathsOverlap(writeA, writeB))
            errors.push(
              `concurrent write overlap between ${a.id} and ${b.id} (${writeA} ~ ${writeB})`
            );
        }
      }
    }
  }
}

function validateDependencyGraph(tasksById, errors) {
  for (const [id, task] of tasksById) {
    for (const dep of task.depends_on) {
      if (!tasksById.has(dep))
        errors.push(`task ${id}: unknown dependency "${dep}"`);
    }
  }

  const visiting = new Set();
  const visited = new Set();

  const visit = (id) => {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      errors.push(`dependency cycle involving ${id}`);
      return;
    }
    visiting.add(id);
    const task = tasksById.get(id);
    if (task) for (const dep of task.depends_on) visit(dep);
    visiting.delete(id);
    visited.add(id);
  };

  for (const id of tasksById.keys()) visit(id);
}

export function validateWaves({ waves }, skillIds) {
  const errors = [];
  const tasksById = new Map();
  const schemaOwners = [];

  for (const [waveName, tasks] of waves) {
    const writeSets = [];
    for (const task of tasks) {
      if (tasksById.has(task.id)) errors.push(`duplicate task id: ${task.id}`);
      tasksById.set(task.id, { ...task, waveName });
      validateTask(task, skillIds, errors, schemaOwners);
      writeSets.push({ id: task.id, writes: task.writes });
    }
    validateWaveWriteOverlap(waveName, writeSets, errors);
  }

  if (schemaOwners.length > 1)
    errors.push(`multiple schema_owner tasks: ${schemaOwners.join(", ")}`);

  validateDependencyGraph(tasksById, errors);
  validateConcurrentWriteOverlap(tasksById, errors);

  return errors;
}

export function loadAndValidateInitiative(slug, repositoryRootPath) {
  const slugError = validateSlug(slug);
  if (slugError) return { errors: [slugError], ok: false };

  const filePath = initiativePath(slug, repositoryRootPath);
  if (!existsSync(filePath))
    return { errors: [`missing initiative: ${filePath}`], ok: false };

  const markdown = readFileSync(filePath, "utf-8");
  const parsed = parseInitiativeWaves(markdown);
  const skillIds = loadSkillsLock(repositoryRootPath);
  const errors = validateWaves(parsed, skillIds);
  return { errors, filePath, markdown, ok: errors.length === 0, parsed };
}

export function listAllTasks(parsed) {
  const tasks = [];
  for (const [, waveTasks] of parsed.waves)
    for (const task of waveTasks) tasks.push(task);
  return tasks;
}

export function tasksByIdMap(parsed) {
  const map = new Map();
  for (const task of listAllTasks(parsed)) map.set(task.id, task);
  return map;
}
