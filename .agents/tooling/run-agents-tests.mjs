import { spawnSync } from "node:child_process";

const forwarded = process.argv.slice(2);

if (forwarded.length) {
  const result = spawnSync(process.execPath, ["--test", ...forwarded], {
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

const chain = [
  ["pnpm", ["flow:test"]],
  ["pnpm", ["architecture:test"]],
  ["pnpm", ["ownership:test"]],
  ["pnpm", ["test:tooling"]],
  ["pnpm", ["eval:test"]],
];

for (const [cmd, args] of chain) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
