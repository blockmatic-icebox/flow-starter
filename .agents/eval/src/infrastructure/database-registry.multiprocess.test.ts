import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { after, describe, it } from "node:test";

import { runEvalDir } from "../paths.ts";
import { loadDatabaseRegistry } from "./database-registry.ts";

const worker = path.join(import.meta.dirname, "database-registry.worker.ts");

const runWorker = async ({
  databaseName,
  index,
  runId,
}: {
  databaseName: string;
  index: number;
  runId: string;
}) => {
  const child = spawn(
    process.execPath,
    [
      "--import",
      "tsx",
      worker,
      "register",
      runId,
      databaseName,
      `flow:S0${index + 1}:1`,
    ],
    {
      cwd: import.meta.dirname,
      stdio: "inherit",
    }
  );
  const [code] = await once(child, "exit");
  if (code !== 0) throw new Error(`worker exit ${code}`);
};

describe("database-registry multiprocess", () => {
  const runId = `registry-mp-${Date.now()}`;

  after(() => {
    const dir = runEvalDir(runId);
    if (existsSync(dir)) rmSync(dir, { force: true, recursive: true });
  });

  it("serializes concurrent register from separate processes", async () => {
    const names = [
      "flow_eval_a1b2c3d4",
      "flow_eval_b2c3d4e5",
      "flow_eval_c3d4e5f6",
      "flow_eval_d4e5f6a7",
    ];
    await Promise.all(
      names.map((databaseName, index) =>
        runWorker({ databaseName, index, runId })
      )
    );
    const active = loadDatabaseRegistry({ runId }).entries.filter(
      (e) => e.status === "active"
    );
    assert.equal(active.length, names.length);
  });
});
