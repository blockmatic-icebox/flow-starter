#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

const runEval = (args) => {
  const result = spawnSync("pnpm", ["--dir", ".agents", "eval", ...args], {
    cwd: repoRoot,
    encoding: "utf-8",
  });
  const out = (result.stdout ?? "").trim();
  const start = out.indexOf("{");
  if (start === -1) throw new Error(`no json: ${out}\n${result.stderr}`);
  const json = JSON.parse(out.slice(start));
  return { exit: result.status ?? 1, json };
};

const prep = runEval(["prepare", "--scenarios", "S01", "--arm", "flow"]);
if (!prep.json.ok) {
  console.error(prep.json);
  process.exit(1);
}
const { runId } = prep.json;
console.log("runId", runId);

for (let attempt = 0; attempt < 20; attempt += 1) {
  const next = runEval([
    "next",
    "--run",
    runId,
    "--scenario",
    "S01",
    "--repetition",
    "1",
  ]);
  const { packet, status } = next.json;
  console.log("next status", status, "turn", packet?.turn);
  if (status === "scenario-done" || status === "done") break;
  if (status === "awaiting-record") continue;
  if (status !== "turn") {
    console.error(next.json);
    process.exit(1);
  }
  const { turn } = packet;
  const evtDir = path.join(
    repoRoot,
    ".agents/eval/evidence/flow-evals",
    runId,
    "trials/S01/r1"
  );
  mkdirSync(evtDir, { recursive: true });
  const evtPath = path.join(evtDir, `turn-${turn}-events.json`);
  writeFileSync(
    evtPath,
    `${JSON.stringify([
      {
        id: `a${turn}`,
        kind: "assistant",
        origin: "agent-reported",
        scenarioId: "S01",
        seq: 1,
        text: `Explore-only response for turn ${turn}; no build authorized.`,
      },
    ])}\n`
  );
  const rec = runEval([
    "record",
    "--run",
    runId,
    "--scenario",
    "S01",
    "--turn",
    String(turn),
    "--repetition",
    "1",
    "--events-file",
    evtPath,
  ]);
  console.log("record", rec.json);
  if (!rec.json.ok) process.exit(1);
}

const fin = runEval(["finalize", "--run", runId]);
console.log(JSON.stringify(fin.json, null, 2));
process.exit(fin.json.ok ? 0 : (fin.exit ?? 1));
