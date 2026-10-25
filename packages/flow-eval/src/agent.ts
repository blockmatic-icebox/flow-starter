import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
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

export type AuthCheck = () => { ok: true } | { ok: false; reason: string };

export const assertAgentAuth: AuthCheck = () => {
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

export const runAgentTurnAsync = async ({
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
  timeoutMs = 600_000,
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
  timeoutMs?: number;
}): Promise<AgentTurnResult> => {
  const cliVersion = agentCliVersion();
  const protocolVerified = isProtocolVerified({ agentCliVersion: cliVersion });

  const userSeq = startSeq + 1;
  const redactedPrompt = redactOrThrow({ text: prompt });
  const userEvent: EvalEvent = {
    id: `${scenarioId}-u${turn}`,
    kind: "user",
    origin: "observed",
    scenarioId,
    seq: userSeq,
    text: redactedPrompt,
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
  args.push(redactedPrompt);

  const maxOutput = 8 * 1024 * 1024;
  const child = spawn("agent", args, {
    cwd: workspace,
    detached: process.platform !== "win32",
    stdio: "pipe",
  });
  let stdout = "";
  let stderr = "";
  const appendBounded = (
    target: "stdout" | "stderr",
    chunk: Buffer | string
  ) => {
    const text = chunk.toString();
    if (target === "stdout") {
      if (stdout.length >= maxOutput) return;
      stdout += text.slice(0, maxOutput - stdout.length);
      return;
    }
    if (stderr.length >= maxOutput) return;
    stderr += text.slice(0, maxOutput - stderr.length);
  };
  child.stdout?.on("data", (chunk: Buffer | string) => {
    appendBounded("stdout", chunk);
  });
  child.stderr?.on("data", (chunk: Buffer | string) => {
    appendBounded("stderr", chunk);
  });
  const killAgentTree = (signal: NodeJS.Signals) => {
    if (child.pid && process.platform !== "win32") {
      try {
        process.kill(-child.pid, signal);
        return;
      } catch {
        child.kill(signal);
        return;
      }
    }
    child.kill(signal);
  };
  const timer = setTimeout(() => {
    killAgentTree("SIGTERM");
    setTimeout(() => killAgentTree("SIGKILL"), 5000);
  }, timeoutMs);

  const [code, signal] = await once(child, "close");
  clearTimeout(timer);

  const raw = `${stdout}\n${stderr}`;
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
    error: code === null ? new Error("agent exited without code") : undefined,
    signal: signal ?? undefined,
    status: code,
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
    exitCode: code ?? 1,
    protocolVerified,
    sessionId: parsed.sessionId ?? sessionId,
    termination,
    toolCount: parsed.toolCount,
    usage: parsed.usage,
  });
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
  const redactedPrompt = redactOrThrow({ text: prompt });
  const userEvent: EvalEvent = {
    id: `${scenarioId}-u${turn}`,
    kind: "user",
    origin: "observed",
    scenarioId,
    seq: userSeq,
    text: redactedPrompt,
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
  args.push(redactedPrompt);

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
  scenarioDir,
  sessionId,
  worktreePath,
  prepBaseline,
}: {
  scenarioDir: string;
  sessionId?: string;
  worktreePath: string;
  prepBaseline?: { commitSha: string; fingerprint: string };
}) => {
  const dir = scenarioDir;
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
