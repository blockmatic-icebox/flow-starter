import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");

const run = (command, cwd) => {
  const result = spawnSync(command, {
    cwd,
    encoding: "utf-8",
    env: process.env,
    shell: true,
    stdio: "pipe",
  });
  return {
    exitCode: result.status ?? 1,
    stderr: result.stderr,
    stdout: result.stdout,
  };
};

const main = () => {
  const temp = mkdtempSync(path.join(tmpdir(), "flow-factory-checkout-"));
  const archive = run(
    `git archive --format=tar HEAD | tar -x -C ${temp}`,
    repoRoot
  );
  if (archive.exitCode !== 0) {
    console.error(archive.stderr);
    process.exit(archive.exitCode);
  }

  const install = run("pnpm --filter @repo/flow-eval test", temp);
  const mutations = run("pnpm --filter @repo/flow-eval eval mutations", temp);
  const benchmark = run(
    "pnpm --filter @repo/flow-eval eval benchmark --id benchmark-a",
    temp
  );

  rmSync(temp, { force: true, recursive: true });

  const ok =
    install.exitCode === 0 &&
    mutations.exitCode === 0 &&
    benchmark.exitCode === 0;
  console.log(
    JSON.stringify(
      {
        benchmark: benchmark.exitCode,
        install: install.exitCode,
        mutations: mutations.exitCode,
        ok,
      },
      null,
      2
    )
  );
  if (!ok) process.exit(1);
};

main();
