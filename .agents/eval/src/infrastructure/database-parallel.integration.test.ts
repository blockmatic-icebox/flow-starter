import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { describe, it } from "node:test";

import { currentFlowSha } from "../git.ts";
import { repoRoot } from "../paths.ts";
import { prepareInstalledSubject } from "../product/prepare-installed-product.ts";
import { defaultAdminDatabaseUrl } from "./connection-url.ts";
import {
  cleanupSubjectDatabase,
  migrateSubjectDatabase,
  provisionSubjectDatabase,
  verifySubjectDatabase,
} from "./database.ts";
import { integrationPrerequisites } from "./neon-local.ts";
import { connectPostgres } from "./postgres-client.ts";
import { subjectEnvFilePath } from "./subject-env.ts";

process.env.DATABASE_TLS_INSECURE_LOCAL = "1";
const integration = integrationPrerequisites();

const removeWorktree = ({ worktreePath }: { worktreePath: string }) => {
  if (!worktreePath) return;
  spawnSync("git", ["worktree", "remove", "--force", worktreePath], {
    cwd: repoRoot,
    encoding: "utf-8",
  });
};

describe("parallel database isolation", { skip: !integration.ok }, () => {
  it("isolates three concurrent subjects", async () => {
    const runId = `parallel-${Date.now()}`;
    const adminUrl = defaultAdminDatabaseUrl();
    const flowSha = currentFlowSha();
    const subjects = [0, 1, 2].map((index) => {
      const prepared = prepareInstalledSubject({
        arm: "flow",
        flowSha,
        prepareNonce: `p-${index}`,
        repetition: 1,
        runId,
        scenarioId: "S01",
        withFixture: false,
        withSetup: process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP !== "1",
      });
      return { index, prepared };
    });

    try {
      const records = await Promise.all(
        subjects.map(({ prepared }) =>
          provisionSubjectDatabase({
            adminUrl,
            identity: prepared.identity,
            runId,
            worktreePath: prepared.worktreePath,
          })
        )
      );

      for (const { prepared } of subjects)
        migrateSubjectDatabase({ worktreePath: prepared.worktreePath });

      const markers = await Promise.all(
        subjects.map(async ({ index, prepared }, subjectIndex) => {
          await verifySubjectDatabase({ worktreePath: prepared.worktreePath });
          const marker = `marker-${index}`;
          const url = records[subjectIndex]?.databaseUrl;
          assert.ok(url);
          const sql = connectPostgres({ url });
          await sql`
            insert into app_meta (id, value) values (${marker}, ${"parallel"})
            on conflict (id) do update set value = excluded.value
          `;
          await sql.end({ timeout: 5 });
          return { marker, prepared };
        })
      );

      await Promise.all(
        markers.map(async ({ marker, prepared }) => {
          const record = records.find(
            (r) => r.worktreePath === prepared.worktreePath
          );
          assert.ok(record?.databaseUrl);
          const sql = connectPostgres({ url: record.databaseUrl });
          const rows = await sql`select id from app_meta where id = ${marker}`;
          assert.equal(rows.length, 1);
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

      const first = subjects[0]?.prepared.identity.databaseName;
      assert.ok(first);
      await cleanupSubjectDatabase({ adminUrl, databaseName: first, runId });
      const secondUrl = records[1]?.databaseUrl;
      assert.ok(secondUrl);
      const sql = connectPostgres({ url: secondUrl });
      const secondMarker = markers[1]?.marker;
      assert.ok(secondMarker);
      const still =
        await sql`select id from app_meta where id = ${secondMarker}`;
      assert.equal(still.length, 1);
      await sql.end({ timeout: 5 });
    } finally {
      await Promise.all(
        subjects.map(async ({ prepared }) => {
          await cleanupSubjectDatabase({
            adminUrl,
            databaseName: prepared.identity.databaseName,
            runId,
          });
          removeWorktree({ worktreePath: prepared.worktreePath });
        })
      );
    }
  });

  it("failed migration on one subject does not affect a sibling", async () => {
    const runId = `parallel-mig-fail-${Date.now()}`;
    const adminUrl = defaultAdminDatabaseUrl();
    const flowSha = currentFlowSha();
    const prepared = [0, 1].map((index) =>
      prepareInstalledSubject({
        arm: "flow",
        flowSha,
        prepareNonce: `fail-${index}`,
        repetition: 1,
        runId,
        scenarioId: "S01",
        withFixture: false,
        withSetup: process.env.FLOW_EVAL_SKIP_PRODUCT_SETUP !== "1",
      })
    );

    try {
      await Promise.all(
        prepared.map((subject) =>
          provisionSubjectDatabase({
            adminUrl,
            identity: subject.identity,
            runId,
            worktreePath: subject.worktreePath,
          })
        )
      );
      migrateSubjectDatabase({ worktreePath: prepared[1]?.worktreePath ?? "" });
      writeFileSync(
        subjectEnvFilePath(prepared[0]?.worktreePath ?? ""),
        "DATABASE_URL=\n"
      );
      assert.throws(() =>
        migrateSubjectDatabase({
          worktreePath: prepared[0]?.worktreePath ?? "",
        })
      );
      await verifySubjectDatabase({
        worktreePath: prepared[1]?.worktreePath ?? "",
      });
    } finally {
      await Promise.all(
        prepared.map(async (subject) => {
          await cleanupSubjectDatabase({
            adminUrl,
            databaseName: subject.identity.databaseName,
            runId,
          });
          removeWorktree({ worktreePath: subject.worktreePath });
        })
      );
    }
  });
});
