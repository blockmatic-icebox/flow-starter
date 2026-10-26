import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { featureRequest, featureRequestSupport } from "@repo/db";
import { eq, inArray } from "drizzle-orm";

import { getDb } from "../db/get-db";
import { DispositionError, setDisposition } from "./set-disposition";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

const insertPublished = async ({
  db,
  title,
}: {
  db: ReturnType<typeof getDb>;
  title: string;
}) => {
  const [row] = await db
    .insert(featureRequest)
    .values({
      description: `${title} description`,
      publishedAt: new Date(),
      source: "internal",
      status: "published",
      title,
    })
    .returning();
  assert.ok(row);
  return row;
};

const insertPendingConfirm = async ({
  db,
  title,
}: {
  db: ReturnType<typeof getDb>;
  title: string;
}) => {
  const [row] = await db
    .insert(featureRequest)
    .values({
      description: `${title} description`,
      source: "internal",
      status: "pending_confirm",
      title,
    })
    .returning();
  assert.ok(row);
  return row;
};

describe("setDisposition integration", { skip: !hasDatabase }, () => {
  const createdIds: string[] = [];

  after(async () => {
    if (!hasDatabase || createdIds.length === 0) return;
    const db = getDb();
    await db
      .delete(featureRequestSupport)
      .where(inArray(featureRequestSupport.requestId, createdIds));
    await db
      .delete(featureRequest)
      .where(inArray(featureRequest.id, createdIds));
  });

  it("rolls source support into merge target", async () => {
    const db = getDb();
    const target = await insertPublished({
      db,
      title: `merge-target-${Date.now()}`,
    });
    const source = await insertPublished({
      db,
      title: `merge-source-${Date.now()}`,
    });
    createdIds.push(target.id, source.id);

    await db.insert(featureRequestSupport).values([
      { requestId: source.id, supporterKey: `supporter-a-${source.id}` },
      { requestId: source.id, supporterKey: `supporter-b-${source.id}` },
    ]);

    const result = await setDisposition({
      db,
      disposition: "merge",
      dispositionRationale: "Duplicate of target",
      mergeTargetId: target.id,
      requestId: source.id,
    });

    assert.equal(result.request.status, "archived");
    assert.equal(result.request.disposition, "merge");
    if ("mergeTargetId" in result)
      assert.equal(result.mergeTargetId, target.id);

    const targetSupports = await db
      .select()
      .from(featureRequestSupport)
      .where(eq(featureRequestSupport.requestId, target.id));
    assert.equal(targetSupports.length, 2);

    const sourceSupports = await db
      .select()
      .from(featureRequestSupport)
      .where(eq(featureRequestSupport.requestId, source.id));
    assert.equal(sourceSupports.length, 0);
  });

  it("rejects a second disposition on the same request", async () => {
    const db = getDb();
    const request = await insertPublished({
      db,
      title: `double-disposition-${Date.now()}`,
    });
    createdIds.push(request.id);

    await setDisposition({
      db,
      disposition: "monitor",
      dispositionRationale: "Watch adoption",
      requestId: request.id,
    });

    await assert.rejects(
      () =>
        setDisposition({
          db,
          disposition: "decline",
          dispositionRationale: "Not now",
          requestId: request.id,
        }),
      (error: unknown) =>
        error instanceof DispositionError &&
        error.code === "already_dispositioned"
    );
  });

  it("rejects disposition on pending_confirm requests", async () => {
    const db = getDb();
    const request = await insertPendingConfirm({
      db,
      title: `pending-disposition-${Date.now()}`,
    });
    createdIds.push(request.id);

    await assert.rejects(
      () =>
        setDisposition({
          db,
          disposition: "monitor",
          dispositionRationale: "Should not apply",
          requestId: request.id,
        }),
      (error: unknown) =>
        error instanceof DispositionError && error.code === "invalid_status"
    );
  });
});
