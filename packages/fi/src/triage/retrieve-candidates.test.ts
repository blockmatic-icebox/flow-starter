import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { retrieveLexicalCandidates } from "./retrieve-candidates";

describe("retrieveLexicalCandidates", () => {
  it("ranks CSV-related published requests higher", () => {
    const candidates = retrieveLexicalCandidates({
      description: "export analytics data",
      limit: 5,
      published: [
        {
          description: "csv export please",
          id: "a",
          title: "Export dashboards to CSV",
        },
        {
          description: "notify team",
          id: "b",
          title: "Slack alerts",
        },
      ],
      title: "Need csv dump",
    });

    assert.equal(candidates[0]?.id, "a");
    assert.ok((candidates[0]?.score ?? 0) > (candidates[1]?.score ?? 0));
  });
});
