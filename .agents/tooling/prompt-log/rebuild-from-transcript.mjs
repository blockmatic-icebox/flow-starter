import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { repoRoot } from "../lib/repo-paths.mjs";
import { redactForLog } from "./redact.mjs";

const extractUserQuery = (text) => {
  const match = text.match(/<user_query>\s*([\s\S]*?)\s*<\/user_query>/u);
  const raw = match ? match[1].trim() : null;
  if (!raw) return null;
  return raw.replace(/<timestamp>[\s\S]*?<\/timestamp>\s*/u, "").trim();
};

const extractTimestamp = (text) => {
  const match = text.match(/<timestamp>([\s\S]*?)<\/timestamp>/u);
  return match ? match[1].trim() : null;
};

const textFromMessage = (message) => {
  const parts = message?.content ?? [];
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
};

const summarizeAgent = (text) => {
  const withoutSkills =
    text.split(/\n---\n\*\*Skills loaded\*\*/u)[0]?.trim() ?? text;
  const taskReport = withoutSkills.match(/\*\*Task report\*\*[\s\S]*/u)?.[0];
  if (taskReport) {
    const outcome = taskReport.match(/\*\*Outcome\*\*[^\n]*\n+([^\n#]+)/u)?.[1];
    if (outcome) return redactForLog(outcome.trim());
  }
  const lines = withoutSkills
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("[REDACTED]"));
  return redactForLog(lines.slice(0, 4).join(" ").slice(0, 700));
};

const buildBlock = ({ timestamp, work, stage, human, agent }) =>
  [
    "---",
    `Timestamp: ${timestamp}`,
    `Work: ${work}`,
    `Stage: ${stage}`,
    "",
    `Human: ${human}`,
    "",
    `Agent: ${agent}`,
    "",
    "---",
    "",
  ].join("\n");

const parseTranscriptTurns = (transcriptPath) => {
  const lines = readFileSync(transcriptPath, "utf-8")
    .split("\n")
    .filter(Boolean);
  const turns = [];
  let pendingUser = null;
  let pendingTs = null;
  let assistantChunks = [];

  const flush = () => {
    if (!pendingUser) return;
    turns.push({
      agent: summarizeAgent(assistantChunks.join("\n\n")),
      human: pendingUser,
      timestampLabel: pendingTs,
    });
    pendingUser = null;
    pendingTs = null;
    assistantChunks = [];
  };

  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row.role === "user") {
      const text = textFromMessage(row.message);
      const q = extractUserQuery(text);
      if (!q) continue;
      if (q.startsWith("Briefly inform the user about the task result"))
        continue;
      flush();
      pendingUser = q;
      pendingTs = extractTimestamp(text);
    } else if (row.role === "assistant" && pendingUser) {
      const text = textFromMessage(row.message);
      if (text) assistantChunks.push(text);
    }
  }
  flush();
  return turns;
};

const gitPrompts = (ref) =>
  execSync(`git show ${ref}:prompts.txt`, { cwd: repoRoot, encoding: "utf-8" });

const run = ({
  transcriptPath,
  gitRef = "origin/meta-cto",
  sessionMarker = "Human: lets make a plan to run our task in parallel",
}) => {
  const prior = gitPrompts(gitRef);
  const split = prior.indexOf(sessionMarker);
  if (split === -1)
    throw new Error(`sessionMarker not found in ${gitRef}:prompts.txt`);
  const head = prior.slice(0, split).trimEnd();

  const config = JSON.parse(
    readFileSync(
      path.join(repoRoot, ".agents/flow/prompt-log.config.json"),
      "utf-8"
    )
  );
  const work = config.work ?? "feature-intelligence";
  const stage = config.stage ?? "Build";

  const turns = parseTranscriptTurns(transcriptPath);
  const middle = turns.map((turn) =>
    buildBlock({
      agent: turn.agent || "(no assistant summary in transcript)",
      human: turn.human,
      stage,
      timestamp: turn.timestampLabel ?? new Date().toISOString(),
      work,
    })
  );

  const out = [head, "", ...middle].join("\n").trimEnd();
  writeFileSync(path.join(repoRoot, "prompts.txt"), `${out}\n`, "utf-8");

  return {
    gitRef,
    headChars: head.length,
    sessionTurns: turns.length,
    totalLines: out.split("\n").length,
  };
};

const transcriptPath = process.argv[2];
const gitRef = process.argv[3] ?? "origin/meta-cto";
if (!transcriptPath) {
  console.error(
    "Usage: node rebuild-from-transcript.mjs <transcript.jsonl> [git-ref]"
  );
  process.exit(1);
}

console.log(JSON.stringify(run({ gitRef, transcriptPath }), null, 2));
