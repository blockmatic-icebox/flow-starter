import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const lockDir = (repoRoot) => path.join(repoRoot, ".worktrees", "locks");

export const acquireIntegrateLock = ({ repoRoot }) => {
  mkdirSync(lockDir(repoRoot), { recursive: true });
  const file = path.join(lockDir(repoRoot), "integrate.lock");
  const payload = { at: new Date().toISOString(), pid: process.pid };

  try {
    writeFileSync(file, `${JSON.stringify(payload)}\n`, {
      encoding: "utf-8",
      flag: "wx",
    });
    return {
      ok: true,
      release: () => {
        try {
          rmSync(file, { force: true });
        } catch {
          // ignore
        }
      },
    };
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }

  if (existsSync(file)) {
    try {
      const existing = JSON.parse(readFileSync(file, "utf-8"));
      if (existing.pid) {
        try {
          process.kill(existing.pid, 0);
          return {
            ok: false,
            reason: `integration locked by pid ${existing.pid}`,
          };
        } catch {
          rmSync(file, { force: true });
          return acquireIntegrateLock({ repoRoot });
        }
      }
    } catch {
      rmSync(file, { force: true });
      return acquireIntegrateLock({ repoRoot });
    }
  }

  return { ok: false, reason: "integration lock unavailable" };
};
