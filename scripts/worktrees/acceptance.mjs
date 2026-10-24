import { spawnSync } from "node:child_process";

export const runAcceptance = ({ cwd, command }) => {
  const result = spawnSync(command, {
    cwd,
    encoding: "utf-8",
    env: process.env,
    shell: true,
    stdio: "pipe",
  });
  return {
    exitCode: result.status ?? 1,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
};
