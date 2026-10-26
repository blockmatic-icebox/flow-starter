import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { repoRoot } from "../lib/repo-paths.mjs";
import { parseLastTurnFromTranscript } from "./parse-transcript.mjs";
import { redactForLog } from "./redact.mjs";

const enabledMarker = "## Local prompt log (enabled)";
const stateRel = ".agents/flow/local/prompt-log-hook.state.json";
const pendingRel = ".agents/flow/local/prompt-log-hook.pending.json";

const readJson = (filePath) => {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
};

const writeJson = (filePath, value) => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
};

const isPromptLogEnabled = (root) => {
  const agents = path.join(root, "AGENTS.md");
  if (!existsSync(agents)) return false;
  return readFileSync(agents, "utf-8").includes(enabledMarker);
};

const resolveWorkMeta = (root) => {
  const paths = [
    path.join(root, ".agents/flow/local/prompt-log.json"),
    path.join(root, ".agents/flow/prompt-log.config.json"),
  ];
  for (const configPath of paths) {
    const config = readJson(configPath);
    if (config?.work)
      return {
        stage: config.stage ?? "Build",
        work: config.work,
      };
  }
  return { stage: "Build", work: "general" };
};

const buildBlock = ({ timestamp, work, stage, human, agent, generationId }) =>
  [
    "---",
    `Timestamp: ${timestamp}`,
    `Work: ${work}`,
    `Stage: ${stage}`,
    `Generation: ${generationId}`,
    "",
    `Human: ${redactForLog(human)}`,
    "",
    `Agent: ${redactForLog(agent)}`,
    "",
    "---",
    "",
  ].join("\n");

const resolveHumanAndAgent = ({ hookInput, pending, generationId }) => {
  let human = pending?.generationId === generationId ? pending.human : "";
  let agent = "";

  const transcriptPath = hookInput?.transcript_path;
  if (transcriptPath && existsSync(transcriptPath)) {
    const turn = parseLastTurnFromTranscript(transcriptPath);
    if (turn) {
      human ||= turn.human;
      agent = turn.agent;
    }
  }

  human ||= pending?.human ?? "";
  return { agent, human };
};

export const appendPromptLogOnStop = ({
  root = repoRoot,
  hookInput,
  now = () => new Date(),
}) => {
  if (!isPromptLogEnabled(root)) return { ok: true, skipped: "disabled" };

  const generationId = hookInput?.generation_id;
  if (!generationId) return { ok: true, skipped: "no-generation-id" };

  const statePath = path.join(root, stateRel);
  const state = readJson(statePath) ?? {};
  if (state.lastGenerationId === generationId)
    return { ok: true, skipped: "duplicate-generation" };

  const pendingPath = path.join(root, pendingRel);
  const pending = readJson(pendingPath);
  const { agent, human } = resolveHumanAndAgent({
    generationId,
    hookInput,
    pending,
  });
  if (!human) return { ok: true, skipped: "no-human-text" };

  const { work, stage } = resolveWorkMeta(root);
  const logPath = path.join(root, "prompts.txt");
  const prior = existsSync(logPath) ? readFileSync(logPath, "utf-8") : "";
  const block = buildBlock({
    agent: agent || "(hook: awaiting coordinator summary)",
    generationId,
    human,
    stage,
    timestamp: now().toISOString(),
    work,
  });

  writeFileSync(logPath, `${prior}${block}`, "utf-8");
  writeJson(statePath, { lastGenerationId: generationId });
  if (pending?.generationId === generationId) writeJson(pendingPath, {});

  return { appended: true, ok: true };
};

export const stashPromptOnSubmit = ({
  root = repoRoot,
  hookInput,
  now = () => new Date(),
}) => {
  if (!isPromptLogEnabled(root)) return { ok: true, skipped: "disabled" };

  const prompt = hookInput?.prompt;
  const generationId = hookInput?.generation_id;
  if (!prompt || !generationId)
    return { ok: true, skipped: "incomplete-input" };

  const human = prompt
    .replaceAll(/<timestamp>[\s\S]*?<\/timestamp>\s*/gu, "")
    .replaceAll(/<user_query>\s*/gu, "")
    .replaceAll(/<\/user_query>\s*/gu, "")
    .trim();

  writeJson(path.join(root, pendingRel), {
    generationId,
    human,
    recordedAt: now().toISOString(),
  });

  return { ok: true, stashed: true };
};

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf-8");
};

const runCli = async () => {
  const mode = process.argv[2] ?? "stop";
  const raw = await readStdin();
  let hookInput = {};
  if (raw.trim()) {
    try {
      hookInput = JSON.parse(raw);
    } catch {
      process.exit(0);
    }
  }

  const result =
    mode === "submit"
      ? stashPromptOnSubmit({ hookInput })
      : appendPromptLogOnStop({
          hookInput,
          root: hookInput.workspace_roots?.[0] ?? repoRoot,
        });

  if (!result.ok) process.exit(1);
  process.stdout.write("{}\n");
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch(() => process.exit(0));
}
