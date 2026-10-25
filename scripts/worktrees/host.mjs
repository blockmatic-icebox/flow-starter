import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";

import { worktreeTopLevel } from "./git.mjs";

export const probeCursorAgent = () => {
  try {
    const version = spawnSync("agent", ["--version"], { encoding: "utf-8" });
    if (version.status !== 0) return { ok: false, reason: "agent CLI missing" };
  } catch {
    return { ok: false, reason: "agent CLI missing" };
  }

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
  return { ok: true };
};

export const runCursorWorker = ({ worktreePath, prompt, model }) => {
  const args = [
    "-p",
    "--output-format",
    "text",
    "--trust",
    "--sandbox",
    "enabled",
    "--workspace",
    worktreePath,
  ];
  if (model) args.push("--model", model);
  args.push(prompt);

  const result = spawnSync("agent", args, {
    cwd: worktreePath,
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
    stdio: "pipe",
    timeout: 600_000,
  });

  const top = worktreeTopLevel({ cwd: worktreePath });
  const expected = worktreePath;
  if (top !== expected)
    return {
      exitCode: result.status ?? 1,
      ok: false,
      reason: `worktree toplevel mismatch: ${top} !== ${expected}`,
    };

  return {
    exitCode: result.status ?? 1,
    ok: (result.status ?? 1) === 0,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
};

export const runCommandWorker = ({ worktreePath, command, env }) => {
  const parts = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/gu) ?? [command];
  const argv = parts.map((p) => p.replaceAll(/^['"]|['"]$/gu, ""));
  const bin = argv[0];
  const args = argv.slice(1);

  const result = spawnSync(bin, args, {
    cwd: worktreePath,
    encoding: "utf-8",
    env: { ...process.env, ...env, FLOW_WORKTREE_PATH: worktreePath },
    stdio: "pipe",
  });

  return {
    exitCode: result.status ?? 1,
    ok: (result.status ?? 1) === 0,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
};

export const runCommandWorkerAsync = async ({
  worktreePath,
  command,
  env,
  timeoutMs = 600_000,
}) => {
  const child = spawn(command, {
    cwd: worktreePath,
    encoding: "utf-8",
    env: { ...process.env, ...env, FLOW_WORKTREE_PATH: worktreePath },
    shell: true,
    stdio: "pipe",
  });
  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr?.on("data", (chunk) => {
    stderr += chunk;
  });
  const timer = setTimeout(() => {
    child.kill("SIGTERM");
  }, timeoutMs);
  const [code] = await once(child, "close");
  clearTimeout(timer);
  if (code === null)
    return {
      exitCode: 1,
      ok: false,
      reason: "worker timeout",
      stderr,
      stdout,
    };
  return {
    exitCode: code ?? 1,
    ok: (code ?? 1) === 0,
    stderr,
    stdout,
  };
};
