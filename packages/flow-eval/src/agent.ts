import { execSync, spawnSync } from "node:child_process";
import { appendFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { redactOrThrow } from "./redact.ts";
import type { EvalEvent } from "./types.ts";

export const agentCliVersion = () => {
  try {
    return execSync("agent --version", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
};

export const assertAgentAuth = () => {
  const result = spawnSync("agent", ["--list-models"], {
    encoding: "utf-8",
    timeout: 30_000,
  });
  const combined = `${result.stdout}\n${result.stderr}`;
  if (/authentication|login required|not authenticated/giu.test(combined))
    return {
      ok: false,
      reason:
        "Cursor CLI requires authentication. Run `agent login` or set CURSOR_API_KEY.",
    };
  if (result.status !== 0)
    return {
      ok: false,
      reason: `agent --list-models failed: ${combined.slice(0, 200)}`,
    };
  return { ok: true as const };
};

export const runAgentTurn = ({
  workspace,
  modelId,
  prompt,
  sessionId,
  jsonlPath,
  rawLogPath,
  scenarioId,
  turn,
}: {
  workspace: string;
  modelId: string;
  prompt: string;
  sessionId?: string;
  jsonlPath: string;
  rawLogPath: string;
  scenarioId: string;
  turn: number;
}) => {
  const args = [
    "-p",
    "--output-format",
    "stream-json",
    "--trust",
    "--sandbox",
    "enabled",
    "--workspace",
    workspace,
    "--model",
    modelId,
  ];
  if (sessionId) args.push("--resume", sessionId);
  args.push(prompt);

  const result = spawnSync("agent", args, {
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: 600_000,
  });

  const raw = `${result.stdout}\n${result.stderr}`;
  const redacted = redactOrThrow({ text: raw });
  mkdirSync(path.join(jsonlPath, ".."), { recursive: true });
  appendFileSync(rawLogPath, `${redacted}\n`);

  const userEvent: EvalEvent = {
    id: `${scenarioId}-u${turn}`,
    kind: "user",
    origin: "observed",
    scenarioId,
    text: prompt,
    ts: new Date().toISOString(),
    turn,
  };
  appendFileSync(jsonlPath, `${JSON.stringify(userEvent)}\n`);

  let newSessionId = sessionId;
  const toolCount = 0;
  for (const line of redacted.split("\n")) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line) as Record<string, unknown>;
      if (typeof obj.session_id === "string") newSessionId = obj.session_id;
      if (obj.type === "tool_call" || obj.type === "tool_use") {
        // counted in completeness elsewhere
      }
    } catch {
      // non-json lines ok
    }
  }

  const assistantEvent: EvalEvent = {
    id: `${scenarioId}-a${turn}`,
    kind: "assistant",
    origin: "observed",
    scenarioId,
    text: redacted.slice(0, 4000),
    ts: new Date().toISOString(),
    turn,
  };
  appendFileSync(jsonlPath, `${JSON.stringify(assistantEvent)}\n`);

  return {
    completeness:
      result.status === 0 && /tool_call|tool_use/gu.test(redacted)
        ? "complete"
        : "partial",
    exitCode: result.status ?? 1,
    sessionId: newSessionId,
    toolCount,
  };
};

export const writeSessionMeta = ({
  runDir,
  scenarioId,
  sessionId,
  worktreePath,
}: {
  runDir: string;
  scenarioId: string;
  sessionId?: string;
  worktreePath: string;
}) => {
  const dir = path.join(runDir, "scenarios", scenarioId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "worktree-path.txt"), `${worktreePath}\n`);
  if (sessionId)
    writeFileSync(path.join(dir, "session-id.txt"), `${sessionId}\n`);
};
