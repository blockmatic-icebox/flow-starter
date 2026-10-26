import { execSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");

const run = (cmd) =>
  execSync(cmd, { cwd: root, env: process.env, stdio: "inherit" });

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

if (hasDatabase) run("pnpm db:migrate");
else
  console.warn(
    "[vercel-build] Skipping db:migrate — DATABASE_URL is not set (typical Preview builds)."
  );

run("pnpm --filter web build");
