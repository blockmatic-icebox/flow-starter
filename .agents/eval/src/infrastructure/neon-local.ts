import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { repoRoot } from "../paths.ts";
import { loadDotenv } from "./load-dotenv.ts";
import { connectPostgres, pingDatabase } from "./postgres-client.ts";

const DEFAULT_READY_TIMEOUT_MS = 120_000;
const READY_POLL_MS = 2000;

export const dockerAvailable = () =>
  spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;

export const runnerNeonCredentialsPresent = () => {
  loadDotenv({ root: repoRoot });
  return Boolean(
    process.env.NEON_API_KEY?.trim() && process.env.NEON_PROJECT_ID?.trim()
  );
};

export const integrationPrerequisites = () => {
  if (!dockerAvailable())
    return { ok: false as const, reason: "Docker is not available" };
  if (!runnerNeonCredentialsPresent())
    return {
      ok: false as const,
      reason: "NEON_API_KEY and NEON_PROJECT_ID required in Factory .env",
    };
  return { ok: true as const };
};

export const startNeonLocalCompose = () => {
  loadDotenv({ root: repoRoot });
  const result = spawnSync("docker", ["compose", "up", "-d", "db"], {
    cwd: repoRoot,
    env: process.env,
    encoding: "utf-8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    const detail = `${result.stdout ?? ""}${result.stderr ?? ""}`.slice(0, 500);
    throw new Error(`docker compose up failed: ${detail}`);
  }
};

export const waitForNeonLocalReady = async ({
  adminUrl,
  timeoutMs = DEFAULT_READY_TIMEOUT_MS,
}: {
  adminUrl: string;
  timeoutMs?: number;
}) => {
  const started = Date.now();
  let lastError = "unknown";

  const attempt = async (): Promise<void> => {
    try {
      const sql = connectPostgres({ url: adminUrl });
      await pingDatabase({ sql });
      await sql.end({ timeout: 5 });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (Date.now() - started >= timeoutMs)
        throw new Error(
          `Neon Local not ready after ${timeoutMs}ms: ${lastError}`,
          { cause: error }
        );
      await delay(READY_POLL_MS);
      return attempt();
    }
  };

  await attempt();
};

export const ensureNeonLocalReady = async ({
  adminUrl,
}: {
  adminUrl: string;
}) => {
  const prereq = integrationPrerequisites();
  if (!prereq.ok) throw new Error(prereq.reason);
  startNeonLocalCompose();
  await waitForNeonLocalReady({ adminUrl });
  return { provider: "neon-local" as const, ready: true };
};
