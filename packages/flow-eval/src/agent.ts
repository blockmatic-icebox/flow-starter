import { spawnSync } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { redactOrThrow } from "./redact.ts";
import {
  isProtocolVerified,
  parseStreamJsonLines,
  terminationFromSpawn,
  turnCompleteness,
  mergeTurnResult,
} from "./trace.ts";
import type { AgentTurnResult, EvalEvent, ScenarioOracle } from "./types.ts";

export const agentCliVersion = () => {
  try {
    return spawnSync("agent", ["--version"], {
      encoding: "utf-8",
    }).stdout.trim();
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
  oracle,
  startSeq,
}: {
  workspace: string;
  modelId: string;
  prompt: string;
  sessionId?: string;
  jsonlPath: string;
  rawLogPath: string;
  scenarioId: string;
  turn: number;
  oracle?: ScenarioOracle;
  startSeq: number;
}): AgentTurnResult => {
  const cliVersion = agentCliVersion();
  const protocolVerified = isProtocolVerified({ agentCliVersion: cliVersion });

  const userSeq = startSeq + 1;
  const userEvent: EvalEvent = {
    id: `${scenarioId}-u${turn}`,
    kind: "user",
    origin: "observed",
    scenarioId,
    seq: userSeq,
    text: prompt,
    ts: new Date().toISOString(),
    turn,
  };

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
  mkdirSync(path.dirname(jsonlPath), { recursive: true });
  appendFileSync(rawLogPath, `${redacted}\n`);

  const parsed = parseStreamJsonLines({
    raw: redacted,
    scenarioId,
    startSeq: userSeq,
    turn,
  });

  const events = [userEvent, ...parsed.events];
  const commandCount = events.filter((e) => e.kind === "command").length;
  const termination = terminationFromSpawn({
    error: result.error,
    signal: result.signal,
    status: result.status,
  });

  const completeness = turnCompleteness({
    commandCount,
    expectsCommands: oracle?.expectsCommands ?? false,
    expectsTools: oracle?.expectsTools ?? false,
    sawMalformed: parsed.sawMalformed,
    sawResultSuccess: parsed.sawResultSuccess,
    termination,
    toolCount: parsed.toolCount,
  });

  for (const e of events) appendFileSync(jsonlPath, `${JSON.stringify(e)}\n`);

  return mergeTurnResult({
    completeness,
    events,
    exitCode: result.status ?? 1,
    protocolVerified,
    sessionId: parsed.sessionId ?? sessionId,
    termination,
    toolCount: parsed.toolCount,
    usage: parsed.usage,
  });
};

export const writeSessionMeta = ({
  runDir,
  scenarioId,
  sessionId,
  worktreePath,
  prepBaseline,
}: {
  runDir: string;
  scenarioId: string;
  sessionId?: string;
  worktreePath: string;
  prepBaseline?: { commitSha: string; fingerprint: string };
}) => {
  const dir = path.join(runDir, "scenarios", scenarioId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "worktree-path.txt"), `${worktreePath}\n`);
  if (sessionId)
    writeFileSync(path.join(dir, "session-id.txt"), `${sessionId}\n`);
  if (prepBaseline)
    writeFileSync(
      path.join(dir, "prep-baseline.json"),
      `${JSON.stringify(prepBaseline, null, 2)}\n`
    );
};
