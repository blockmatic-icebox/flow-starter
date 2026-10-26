import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ConfirmRequestError, confirmRequest } from "./confirm-request";

describe("ConfirmRequestError", () => {
  it("exposes code and name", () => {
    const error = new ConfirmRequestError("not_found", "missing");
    assert.equal(error.code, "not_found");
    assert.equal(error.name, "ConfirmRequestError");
    assert.equal(error.message, "missing");
  });
});

describe("confirmRequest", () => {
  it("returns row when pending_confirm update succeeds", async () => {
    const published = {
      id: "req-1",
      status: "published" as const,
    };
    const db = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([]),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([published]),
          }),
        }),
      }),
    };

    const row = await confirmRequest({
      db: db as never,
      requestId: "req-1",
    });
    assert.equal(row?.status, "published");
  });

  it("throws not_found when request is missing", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([]),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([]),
          }),
        }),
      }),
    };

    await assert.rejects(
      () =>
        confirmRequest({
          db: db as never,
          requestId: "missing",
        }),
      (e: unknown) => e instanceof ConfirmRequestError && e.code === "not_found"
    );
  });

  it("throws invalid_status when not pending_confirm", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([{ status: "published" }]),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([]),
          }),
        }),
      }),
    };

    await assert.rejects(
      () =>
        confirmRequest({
          db: db as never,
          requestId: "req-1",
        }),
      (e: unknown) =>
        e instanceof ConfirmRequestError && e.code === "invalid_status"
    );
  });
});
