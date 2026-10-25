import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const setupDir = import.meta.dirname;
const installScript = path.join(setupDir, "install.sh");

if (!existsSync(installScript)) process.exit(0);

const result = spawnSync(
  "node",
  ["--test", "--test-concurrency=1", path.join(setupDir, "install.test.mjs")],
  {
    stdio: "inherit",
  }
);

process.exit(result.status ?? 1);
