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

const run = ({ transcriptPath, gitRef = "d02d60ace" }) => {
  const prior = gitPrompts(gitRef);
  const headEndMarker =
    "Open: T-3-9 browser, T-2-5/6 evals, T-4-1/2/5, optional eve tools T-2-4.";
  const tailStartMarker = "---\n---\nTimestamp: 2026-10-26T00:25:41.619Z";

  const headEnd = prior.indexOf(headEndMarker) + headEndMarker.length;
  const head = prior.slice(0, headEnd).trimEnd();

  const tailStart = prior.indexOf(tailStartMarker);
  if (tailStart === -1) throw new Error("tailStartMarker not found");
  const tail = prior.slice(tailStart).trimEnd();

  const turns = parseTranscriptTurns(transcriptPath);
  const stopBefore = "FI prompt log, contracts, and spec verification";
  const stopIdx = turns.findIndex((t) => t.human.startsWith(stopBefore));
  const preTailTurns =
    stopIdx === -1 ? turns.slice(0, 29) : turns.slice(0, stopIdx);

  const work = "feature-intelligence";
  const stage = "Build";
  const middle = preTailTurns.map((turn) =>
    buildBlock({
      agent: turn.agent,
      human: turn.human,
      stage,
      timestamp: turn.timestampLabel ?? new Date().toISOString(),
      work,
    })
  );

  const postTailTurns = turns.filter(
    (t) =>
      t.human.includes("push all changes to meta-cto") ||
      t.human === "ok" ||
      t.human.includes("prompts.txt is up date") ||
      t.human.includes("nah we fucked up")
  );

  const post = postTailTurns.map((turn) =>
    buildBlock({
      agent: turn.agent,
      human: turn.human,
      stage: turn.human === "ok" ? "Review" : stage,
      timestamp: turn.timestampLabel ?? new Date().toISOString(),
      work,
    })
  );

  const out = [head, "", ...middle, "", tail, "", ...post].join("\n");
  writeFileSync(path.join(repoRoot, "prompts.txt"), `${out}\n`, "utf-8");

  return {
    middleBlocks: middle.length,
    postBlocks: post.length,
    preTailTurns: preTailTurns.length,
    tailChars: tail.length,
  };
};

const transcriptPath = process.argv[2];
if (!transcriptPath) {
  console.error("Usage: node rebuild-from-transcript.mjs <transcript.jsonl>");
  process.exit(1);
}

console.log(JSON.stringify(run({ transcriptPath }), null, 2));
