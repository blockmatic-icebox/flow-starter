import { execSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");

const run = (cmd) =>
  execSync(cmd, { cwd: root, env: process.env, stdio: "inherit" });

run("pnpm db:migrate");
run("FI_SEED_IF_EMPTY=1 pnpm seed:fi");
run("pnpm --filter web build");
