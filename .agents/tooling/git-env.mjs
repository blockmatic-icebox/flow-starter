import { spawnSync } from "node:child_process";
import path from "node:path";

const HOOK_KEYS = new Set([
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_AUTHOR_DATE",
  "GIT_AUTHOR_EMAIL",
  "GIT_AUTHOR_NAME",
  "GIT_COMMITTER_DATE",
  "GIT_COMMITTER_EMAIL",
  "GIT_COMMITTER_NAME",
  "GIT_DIR",
  "GIT_INDEX_FILE",
  "GIT_OBJECT_DIRECTORY",
]);

const withoutHookKeys = (env) =>
  Object.fromEntries(
    Object.entries(env).filter(([key]) => !HOOK_KEYS.has(key))
  );

const keepHookKeysForRepo = (env, gitMeta) =>
  Object.fromEntries(
    Object.entries(env).filter(([key, value]) => {
      if (!HOOK_KEYS.has(key)) return true;
      if (typeof value !== "string" || !value) return false;
      return path.resolve(value).startsWith(gitMeta);
    })
  );

/** Drop index/object env from a parent `git commit` when running git in another repo. */
export const envForGitCwd = (cwd, baseEnv = process.env, overrides = {}) => {
  const merged = { ...baseEnv, ...overrides };
  const topResult = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf-8",
    env: withoutHookKeys(merged),
  });
  if (topResult.status !== 0) return merged;
  const gitMeta = path.resolve(path.join(topResult.stdout.trim(), ".git"));
  return keepHookKeysForRepo(merged, gitMeta);
};
