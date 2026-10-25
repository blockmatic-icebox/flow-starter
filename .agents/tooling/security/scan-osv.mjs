#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";

const target = path.resolve(
  import.meta.dirname,
  "../../../tooling/security/scan-osv.mjs"
);
const result = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
