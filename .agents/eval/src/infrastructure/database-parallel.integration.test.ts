import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { buildSubjectIdentity } from "../subject-identity.ts";
import { defaultAdminDatabaseUrl } from "./connection-url.ts";
import {
  cleanupSubjectDatabase,
  migrateSubjectDatabase,
  provisionSubjectDatabase,
  verifySubjectDatabase,
} from "./database.ts";
import { integrationPrerequisites } from "./neon-local.ts";
import { connectPostgres } from "./postgres-client.ts";

process.env.DATABASE_TLS_INSECURE_LOCAL = "1";
const integration = integrationPrerequisites();

describe("parallel database isolation", { skip: !integration.ok }, () => {
  it("isolates three concurrent subjects", async () => {
    const runId = `parallel-${Date.now()}`;
    const adminUrl = defaultAdminDatabaseUrl();
    const subjects = [0, 1, 2].map((index) => {
      const identity = buildSubjectIdentity({
        arm: "flow",
        prepareNonce: `p-${index}`,
        repetition: 1,
        runId,
        scenarioId: "S01",
      });
      const worktreePath = mkdtempSync(path.join(tmpdir(), "flow-eval-par-"));
      return { identity, index, worktreePath };
    });

    const records = await Promise.all(
      subjects.map(({ identity, worktreePath }) =>
        provisionSubjectDatabase({
          adminUrl,
          identity,
          runId,
          worktreePath,
        })
      )
    );

    for (const subject of subjects)
      migrateSubjectDatabase({ worktreePath: subject.worktreePath });

    const markers = await Promise.all(
      subjects.map(async ({ identity, worktreePath }, index) => {
        await verifySubjectDatabase({ worktreePath });
        const marker = `marker-${index}`;
        const url = records[index]?.databaseUrl;
        assert.ok(url);
        const sql = connectPostgres({ url });
        await sql`
          insert into app_meta (id, value) values (${marker}, ${"parallel"})
          on conflict (id) do update set value = excluded.value
        `;
        await sql.end({ timeout: 5 });
        return { identity, marker, worktreePath };
      })
    );

    await Promise.all(
      markers.map(async ({ marker, worktreePath }) => {
        const url = records.find(
          (r) => r.worktreePath === worktreePath
        )?.databaseUrl;
        assert.ok(url);
        const sql = connectPostgres({ url });
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

    const first = subjects[0]?.identity.databaseName;
    assert.ok(first);
    await cleanupSubjectDatabase({ adminUrl, databaseName: first, runId });
    const secondUrl = records[1]?.databaseUrl;
    assert.ok(secondUrl);
    const sql = connectPostgres({ url: secondUrl });
    const secondMarker = markers[1]?.marker;
    assert.ok(secondMarker);
    const still = await sql`select id from app_meta where id = ${secondMarker}`;
    assert.equal(still.length, 1);
    await sql.end({ timeout: 5 });

    await Promise.all(
      subjects.map(async ({ identity, worktreePath }) => {
        await cleanupSubjectDatabase({
          adminUrl,
          databaseName: identity.databaseName,
          runId,
        });
        rmSync(worktreePath, { force: true, recursive: true });
      })
    );
  });
});
