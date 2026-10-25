import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { jobsEligibleForDatabaseCleanup } from "./host-session.ts";
import type { HostJobStatus } from "./types.ts";

const job = ({
  databaseName,
  status,
}: {
  databaseName?: string;
  status: HostJobStatus;
}) =>
  ({
    databaseName,
    status,
  }) as Parameters<typeof jobsEligibleForDatabaseCleanup>[0][number];

describe("host-session database cleanup eligibility", () => {
  it("retains pending and awaiting-record jobs", () => {
    const jobs = [
      job({ databaseName: "flow_eval_a1b2c3d4", status: "complete" }),
      job({ databaseName: "flow_eval_b2c3d4e5", status: "pending" }),
      job({ databaseName: "flow_eval_c3d4e5f6", status: "awaiting-record" }),
    ];
    const eligible = jobsEligibleForDatabaseCleanup(jobs);
    assert.equal(eligible.length, 1);
    assert.equal(eligible[0]?.databaseName, "flow_eval_a1b2c3d4");
  });

  it("includes terminal failed jobs", () => {
    const jobs = [
      job({ databaseName: "flow_eval_a1b2c3d4", status: "failed" }),
    ];
    assert.equal(jobsEligibleForDatabaseCleanup(jobs).length, 1);
  });
});
