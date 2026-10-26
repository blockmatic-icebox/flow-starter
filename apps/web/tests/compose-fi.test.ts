import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { composeFiQuery } from "../app/_lib/genui/compose-fi";
import type { ComposeFiDeps } from "../app/_lib/genui/compose-fi";
import { matchFiComposeIntent } from "../app/_lib/genui/compose-fi-routes";

const sampleRow = {
  canonicalRequestId: null,
  decisionBrief: null,
  description: "Saturday dinner rush and I'm down a cook",
  disposition: "monitor" as const,
  dispositionAt: new Date(),
  dispositionRationale: "Track demand",
  id: "00000000-0000-4000-8000-000000000001",
  intakeLinkedRequestId: null,
  mergeTargetId: null,
  pmReviewStartedAt: null,
  problemStatement: "Fill coverage gaps faster",
  publishedAt: new Date(),
  source: "customer" as const,
  status: "published" as const,
  submittedAt: new Date(),
  supportCount: 4,
  themeKey: "scheduling_coverage",
  themeLabel: "Scheduling & coverage",
  themeRationale: null,
  title: "Show certified cooks for Saturday rush",
  triageCompletedAt: new Date(),
  triageConfidence: null,
  triageSteps: null,
};

const mockSearch =
  (items: (typeof sampleRow)[]): ComposeFiDeps["searchRequests"] =>
  () =>
    Promise.resolve({
      items,
      page: 1,
      pageSize: 25,
      total: items.length,
    });

const mockInsights = (): ComposeFiDeps["getInsights"] => () =>
  Promise.resolve({
    avgDecisionReadinessMs: null,
    computedAt: new Date().toISOString(),
    decisionCaptureRate: null,
    intakeLinkRate: null,
    medianPmTriageMs: null,
    medianPmTriageMsProxy: null,
    openQueueCount: 2,
    range: null,
    sample: {
      decisionsInRangeCount: 1,
      dispositionWithRationaleCount: 1,
      intakeLinkCount: 0,
      openQueueCount: 2,
      pmTriageN: 0,
      publishedCount: 5,
      readinessDegradedN: 0,
      readinessN: 0,
    },
    trends: {
      strategicVsPopular: [],
      themes: [
        {
          count: 3,
          label: "Scheduling & coverage",
          priorCount: 1,
          themeKey: "scheduling_coverage",
        },
      ],
      weekly: [],
    },
  });

const mockAttention = (): ComposeFiDeps["listAttentionItems"] => () =>
  Promise.resolve({
    items: [],
    totalCount: 0,
  });

const baseDeps = (search: ComposeFiDeps["searchRequests"]): ComposeFiDeps => ({
  getInsights: mockInsights(),
  listAttentionItems: mockAttention(),
  listRecentDecisions: () => Promise.resolve([]),
  searchRequests: search,
});

describe("matchFiComposeIntent", () => {
  it("maps Crewday assessment starters", () => {
    assert.equal(
      matchFiComposeIntent(
        "What scheduling problems should Crewday prioritize next?"
      ),
      "prioritize-scheduling"
    );
    assert.equal(
      matchFiComposeIntent(
        "Are customers reporting the same shift-swap issue in different ways?"
      ),
      "duplicate-swap"
    );
    assert.equal(
      matchFiComposeIntent(
        "Why are managers and employees disagreeing about shift approvals?"
      ),
      "approval-conflict"
    );
    assert.equal(
      matchFiComposeIntent(
        "Which customer problems have the strongest evidence?"
      ),
      "strongest-evidence"
    );
    assert.equal(
      matchFiComposeIntent(
        "What emerging issues have appeared in the last month?"
      ),
      "emerging-month"
    );
    assert.equal(
      matchFiComposeIntent("Why did we decline a popular request?"),
      "popular-decline"
    );
    assert.equal(
      matchFiComposeIntent(
        "Which open requests need product manager attention?"
      ),
      "open-queue-attention"
    );
    assert.equal(
      matchFiComposeIntent(
        "What evidence supports improving shift-change notifications?"
      ),
      "notification-evidence"
    );
  });
});

describe("composeFiQuery", () => {
  it("validates prioritize-scheduling composition", async () => {
    const result = await composeFiQuery({
      deps: baseDeps(
        mockSearch([
          sampleRow,
          {
            ...sampleRow,
            id: "00000000-0000-4000-8000-000000000002",
            title: "B",
          },
        ])
      ),
      input: {
        clientRequestId: "test-1",
        query: "What scheduling problems should Crewday prioritize next?",
        version: 1,
      },
    });
    assert.equal(result.metadata.validationOk, true);
    assert.equal(result.metadata.tier, 1);
  });

  it("returns empty status for insufficient evidence", async () => {
    const result = await composeFiQuery({
      deps: baseDeps(mockSearch([])),
      input: {
        clientRequestId: "test-2",
        query: "not enough evidence here",
        version: 1,
      },
    });
    assert.equal(result.metadata.validationOk, true);
  });
});
