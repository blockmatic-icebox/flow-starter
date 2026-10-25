#!/usr/bin/env node

import path from "node:path";
import { pathToFileURL } from "node:url";

import { repoRoot as defaultRepoRoot } from "../lib/repo-paths.mjs";
import { listAllTasks, loadAndValidateInitiative } from "./initiative.mjs";
import { prepareReadyTasks, safeCleanupTask } from "./lifecycle.mjs";
import { runInitiative } from "./run.mjs";
import { loadState, saveState } from "./state.mjs";

export {
  initiativePath,
  loadAndValidateInitiative,
  loadSkillsLock,
  parseInitiativeWaves,
  validateWaves,
} from "./initiative.mjs";

function parseArgs(argv) {
  const args = { flags: {}, repo: defaultRepoRoot };
  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--repo") {
      args.repo = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (token === "--host") {
      args.flags.host = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--worker") {
      args.flags.worker = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--model") {
      args.flags.model = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--force") {
      args.flags.force = true;
      continue;
    }
    positional.push(token);
  }
  args.positional = positional;
  return args;
}

function commandCheck(slug, repoRoot) {
  const result = loadAndValidateInitiative(slug, repoRoot);
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

function commandPrepare(slug, waveName, repoRoot) {
  // waveName optional: prepare all dependency-ready tasks
  const result = loadAndValidateInitiative(slug, repoRoot);
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }
  const initiativeRelative = path.relative(repoRoot, result.filePath);
  const { prepared } = prepareReadyTasks({
    initiativeRelative,
    parsed: result.parsed,
    repoRoot,
    slug,
    waveFilter: waveName,
  });
  console.log(`prepared ${prepared.length} task(s): ${prepared.join(", ")}`);
}

async function commandRun(slug, repoRoot, flags) {
  const result = loadAndValidateInitiative(slug, repoRoot);
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }
  const initiativeRelative = path.relative(repoRoot, result.filePath);
  const runResult = await runInitiative({
    host: flags.host,
    initiativeRelative,
    model: flags.model,
    parsed: result.parsed,
    repoRoot,
    slug,
    workerCommand: flags.worker,
  });
  if (runResult.hostWarning) console.warn(`host: ${runResult.hostWarning}`);
  if (!runResult.ok) {
    console.error(runResult.reason ?? "run failed");
    process.exit(1);
  }
  console.log(
    `run complete (parallel=${runResult.parallelClaimed}, capacity=${runResult.maxConcurrent})`
  );
}

function commandStatus(slug, repoRoot) {
  const state = loadState({ repoRoot, slug });
  if (!state) {
    console.log(`no state for ${slug}`);
    return;
  }
  console.log(JSON.stringify(state, null, 2));
}

function commandCleanup(slug, repoRoot, flags) {
  const result = loadAndValidateInitiative(slug, repoRoot);
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }
  const state = loadState({ repoRoot, slug });
  if (!state) {
    console.log("nothing to clean");
    return;
  }
  const tasks = listAllTasks(result.parsed);
  for (const task of tasks) {
    const cleanup = safeCleanupTask({
      force: flags.force,
      repoRoot,
      slug,
      state,
      taskId: task.id,
    });
    if (!cleanup.ok) console.warn(`${task.id}: ${cleanup.reason}`);
    else if (!cleanup.skipped) console.log(`cleaned ${task.id}`);
  }
  saveState({ repoRoot, slug, state });
}

function commandUp(slug, waveName, repoRoot) {
  commandPrepare(slug, waveName, repoRoot);
}

function commandDown(slug, waveName, repoRoot) {
  const result = loadAndValidateInitiative(slug, repoRoot);
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }
  const state = loadState({ repoRoot, slug }) ?? { tasks: {} };
  const tasks = result.parsed.waves.get(waveName);
  if (!tasks?.length) {
    console.error(`unknown or empty wave: ${waveName}`);
    process.exit(1);
  }
  for (const task of tasks) {
    const cleanup = safeCleanupTask({
      force: false,
      repoRoot,
      slug,
      state,
      taskId: task.id,
    });
    if (!cleanup.ok) console.warn(`${task.id}: ${cleanup.reason}`);
    else if (!cleanup.skipped) console.log(`removed ${task.id}`);
  }
}

async function main() {
  const { positional, repo, flags } = parseArgs(process.argv.slice(2));
  const [command, slug, waveName] = positional;

  if (!command || !slug) {
    console.error(
      "usage: worktrees.mjs <check|prepare|up|run|status|cleanup|down> <slug> [wave] [--repo path] [--host cursor] [--worker cmd]"
    );
    process.exit(1);
  }

  if (command === "check") {
    commandCheck(slug, repo);
    return;
  }

  if (command === "status") {
    commandStatus(slug, repo);
    return;
  }

  if (command === "prepare") {
    commandPrepare(slug, waveName, repo);
    return;
  }

  if (command === "up") {
    if (!waveName) {
      console.error("up requires a wave name");
      process.exit(1);
    }
    commandUp(slug, waveName, repo);
    return;
  }

  if (command === "run") {
    await commandRun(slug, repo, flags);
    return;
  }

  if (command === "cleanup") {
    commandCleanup(slug, repo, flags);
    return;
  }

  if (command === "down") {
    if (!waveName) {
      console.error("down requires a wave name");
      process.exit(1);
    }
    commandDown(slug, waveName, repo);
    return;
  }

  console.error(`unknown command: ${command}`);
  process.exit(1);
}

const entrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (import.meta.url === entrypoint) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
