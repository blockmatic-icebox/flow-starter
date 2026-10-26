import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { composeFiQuery } from "../app/_lib/genui/compose-fi";
import type { ComposeFiDeps } from "../app/_lib/genui/compose-fi";
import { matchFiComposeIntent } from "../app/_lib/genui/compose-fi-routes";

const sampleRow = {
  canonicalRequestId: null,
  decisionBrief: null,
  description: "Customer needs weekly exports",
  disposition: "monitor" as const,
  dispositionAt: new Date(),
  dispositionRationale: "Track demand",
  id: "00000000-0000-4000-8000-000000000001",
  intakeLinkedRequestId: null,
  mergeTargetId: null,
  pmReviewStartedAt: null,
  problemStatement: "Automate exports",
  publishedAt: new Date(),
  source: "customer" as const,
  status: "published" as const,
  submittedAt: new Date(),
  supportCount: 4,
  themeKey: "reporting",
  themeLabel: "Reporting",
  themeRationale: null,
  title: "Schedule weekly report exports",
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
      dispositionWithRationaleCount: 1,
      intakeLinkCount: 0,
      openQueueCount: 2,
      pmTriageN: 0,
      publishedCount: 5,
      readinessN: 0,
    },
    trends: {
      strategicVsPopular: [],
      themes: [
        { count: 3, label: "Reporting", priorCount: 1, themeKey: "reporting" },
      ],
      weekly: [],
    },
  });

describe("matchFiComposeIntent", () => {
  it("maps representative prompts", () => {
    assert.equal(
      matchFiComposeIntent("What reporting work should we prioritize?"),
      "prioritize-reporting"
    );
    assert.equal(
      matchFiComposeIntent("Are these requests duplicates?"),
      "duplicates"
    );
    assert.equal(
      matchFiComposeIntent("Why do customers disagree about public links?"),
      "public-links"
    );
    assert.equal(
      matchFiComposeIntent("What changed in customer feedback this month?"),
      "monthly-change"
    );
    assert.equal(
      matchFiComposeIntent("What happened to last week's reviewed feedback?"),
      "recent-decisions"
    );
    assert.equal(
      matchFiComposeIntent(
        "Summarize integration feedback when analysis fails"
      ),
      "integration-failure"
    );
  });
});

describe("composeFiQuery", () => {
  it("validates prioritize-reporting composition", async () => {
    const result = await composeFiQuery({
      deps: {
        getInsights: mockInsights(),
        searchRequests: mockSearch([
          sampleRow,
          {
            ...sampleRow,
            id: "00000000-0000-4000-8000-000000000002",
            title: "B",
          },
        ]),
      },
      input: {
        clientRequestId: "test-1",
        query: "What reporting work should we prioritize?",
        version: 1,
      },
    });
    assert.equal(result.metadata.validationOk, true);
    assert.equal(result.metadata.tier, 1);
  });

  it("returns empty status for insufficient evidence", async () => {
    const result = await composeFiQuery({
      deps: {
        getInsights: mockInsights(),
        searchRequests: mockSearch([]),
      },
      input: {
        clientRequestId: "test-2",
        query: "not enough evidence here",
        version: 1,
      },
    });
    assert.equal(result.metadata.validationOk, true);
  });
});
