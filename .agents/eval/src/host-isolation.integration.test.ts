import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

import { currentFlowSha } from "./git.ts";
import {
  hostSessionFinalize,
  prepareHostRun,
  resumeHostRun,
} from "./host-session.ts";
import { defaultAdminDatabaseUrl } from "./infrastructure/connection-url.ts";
import {
  activeDatabasesForRun,
  registerSubjectDatabase,
} from "./infrastructure/database-registry.ts";
import {
  cleanupOrphanedDatabasesForRun,
  databaseExists,
  migrateSubjectDatabase,
  prepareSubjectDatabase,
} from "./infrastructure/database.ts";
import { integrationPrerequisites } from "./infrastructure/neon-local.ts";
import { connectPostgres } from "./infrastructure/postgres-client.ts";
import { repoRoot } from "./paths.ts";
import { prepareInstalledSubject } from "./product/prepare-installed-product.ts";

process.env.DATABASE_TLS_INSECURE_LOCAL = "1";
const integration = integrationPrerequisites();

const removeWorktree = ({ worktreePath }: { worktreePath: string }) => {
  if (!worktreePath) return;
  spawnSync("git", ["worktree", "remove", "--force", worktreePath], {
    cwd: repoRoot,
    encoding: "utf-8",
  });
};

describe("host isolation integration", { skip: !integration.ok }, () => {
  it("isolates three worktree subjects and preserves foreign registry databases", async () => {
    const runId = `host-iso-${Date.now()}`;
    const foreignRunId = `foreign-run-${Date.now()}`;
    const adminUrl = defaultAdminDatabaseUrl();
    const flowSha = currentFlowSha();
    const scenarioIds = ["S01", "S02", "S05"] as const;
    const subjects = scenarioIds.map((scenarioId, index) => ({
      prepared: prepareInstalledSubject({
        arm: "flow",
        flowSha,
        prepareNonce: `host-${index}`,
        repetition: 1,
        runId,
        scenarioId,
        withFixture: false,
        withSetup: process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP !== "1",
      }),
      scenarioId,
    }));

    const foreignName = "flow_eval_deadbeef";
    await registerSubjectDatabase({
      databaseName: foreignName,
      runId: foreignRunId,
      subjectKey: "foreign:probe:1",
    });

    try {
      const records = await Promise.all(
        subjects
          .filter(({ scenarioId }) => scenarioId !== "S02")
          .map(async ({ prepared, scenarioId }) => {
            const record = await prepareSubjectDatabase({
              identity: prepared.identity,
              runId,
              worktreePath: prepared.worktreePath,
            });
            return { prepared, record, scenarioId };
          })
      );
      assert.equal(records.length, 2);

      for (const { prepared } of records)
        migrateSubjectDatabase({ worktreePath: prepared.worktreePath });

      const markers = await Promise.all(
        records.map(async ({ record, scenarioId }, index) => {
          const marker = `host-marker-${index}`;
          const sql = connectPostgres({ url: record.databaseUrl });
          await sql`
            insert into app_meta (id, value) values (${marker}, ${scenarioId})
            on conflict (id) do update set value = excluded.value
          `;
          await sql.end({ timeout: 5 });
          return { marker, record };
        })
      );

      await Promise.all(
        markers.map(async ({ marker, record }) => {
          const sql = connectPostgres({ url: record.databaseUrl });
          await Promise.all(
            markers
              .filter((other) => other.marker !== marker)
              .map(async (other) => {
                const foreign =
                  await sql`select id from app_meta where id = ${other.marker}`;
                assert.equal(foreign.length, 0);
              })
          );
          await sql.end({ timeout: 5 });
        })
      );

      assert.equal(
        await databaseExists({ adminUrl, databaseName: foreignName }),
        true
      );

      process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP = "1";
      const sessionRunId = `${runId}-session`;
      await prepareHostRun({
        arm: "flow",
        runId: sessionRunId,
        scenarioIds: ["S01"],
      });
      const resumed = await resumeHostRun({
        arm: "flow",
        runId: sessionRunId,
        scenarioIds: ["S01"],
      });
      assert.equal(resumed.ok, true);

      const finalized = await hostSessionFinalize({ runId: sessionRunId });
      assert.equal(finalized.outcome, "partial");

      await cleanupOrphanedDatabasesForRun({ runId });
      assert.equal(activeDatabasesForRun({ runId }).length, 0);
      assert.equal(
        await databaseExists({ adminUrl, databaseName: foreignName }),
        true
      );
    } finally {
      process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP = "1";
      for (const { prepared } of subjects)
        removeWorktree({ worktreePath: prepared.worktreePath });
      await cleanupOrphanedDatabasesForRun({ runId }).catch(() => undefined);
      await cleanupOrphanedDatabasesForRun({ runId: foreignRunId }).catch(
        () => undefined
      );
    }
  });
});
