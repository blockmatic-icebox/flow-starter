import type { AppDatabase } from "@repo/db";
import {
  getInsights,
  listAttentionItems,
  listRecentDecisions,
  searchRequests,
} from "@repo/fi";
import {
  answerDocument,
  collectionDocument,
  openUiStringList,
  openUiStringLiteral,
  publishComposition,
  sectionStackDocument,
  statusDocument,
  synthesizeOpenEndedAnswer,
} from "@repo/genui";
import type {
  ComposeInput,
  ComposeResult,
  ComposeStreamEvent,
  GroundedRecord,
} from "@repo/genui";

import { matchFiComposeIntent } from "./compose-fi-routes";
import {
  evidenceDocId,
  evidenceRecord,
  metricRecord,
  signalEntityId,
  signalRecord,
} from "./fi-records";

type GetInsightsInput = Omit<Parameters<typeof getInsights>[0], "db">;
type SearchRequestsInput = Omit<Parameters<typeof searchRequests>[0], "db">;

type ListRecentDecisionsInput = Omit<
  Parameters<typeof listRecentDecisions>[0],
  "db"
>;

const themeCountDelta = (t: { count: number; priorCount: number | null }) =>
  t.priorCount === null ? 0 : t.count - t.priorCount;

type ListAttentionItemsInput = Omit<
  Parameters<typeof listAttentionItems>[0],
  "db"
>;

export interface ComposeFiDeps {
  getInsights: (args: GetInsightsInput) => ReturnType<typeof getInsights>;
  listAttentionItems: (
    args: ListAttentionItemsInput
  ) => ReturnType<typeof listAttentionItems>;
  listRecentDecisions: (
    args: ListRecentDecisionsInput
  ) => ReturnType<typeof listRecentDecisions>;
  searchRequests: (
    args: SearchRequestsInput
  ) => ReturnType<typeof searchRequests>;
}

const defaultDeps = (db: AppDatabase): ComposeFiDeps => ({
  getInsights: (args) => getInsights({ ...args, db }),
  listAttentionItems: (args) => listAttentionItems({ ...args, db }),
  listRecentDecisions: (args) => listRecentDecisions({ ...args, db }),
  searchRequests: (args) => searchRequests({ ...args, db }),
});

const duplicateSearchQuery = (text: string) =>
  text
    .replaceAll(
      /\b(?:are|customers?|reporting|these|those|requests?|duplicate|duplicates|same|shift-?swap|issue|different|ways)\b/giu,
      " "
    )
    .replaceAll(/\s+/gu, " ")
    .trim();

/* eslint-disable complexity -- routes one user query to multiple FI-backed GenUI envelopes */
export const composeFiQuery = async ({
  db,
  deps,
  input,
  onEvent,
  signal,
}: {
  db?: AppDatabase;
  deps?: ComposeFiDeps;
  input: ComposeInput;
  onEvent?: (event: ComposeStreamEvent) => void;
  signal?: AbortSignal;
}): Promise<ComposeResult> => {
  if (!deps && !db) throw new Error("compose-fi-requires-db-or-deps");

  const fi = deps ?? defaultDeps(db as AppDatabase);
  const query = input.query.trim();
  const requestId = input.clientRequestId;
  let sequence = 0;
  const events: ComposeStreamEvent[] = [];
  const emit = (event: ComposeStreamEvent) => {
    events.push(event);
    onEvent?.(event);
  };

  emit({ requestId, sequence, type: "start" });
  sequence += 1;

  if (signal?.aborted) {
    return {
      events,
      metadata: { tier: 1, validationOk: false },
      modelCalls: 0,
      parseErrors: 0,
    };
  }

  const records: GroundedRecord[] = [];
  const pushSignal = (row: {
    description: string;
    id: string;
    supportCount: number;
    themeLabel: string | null;
    title: string;
  }) => {
    const rec = signalRecord(row);
    if (!records.some((r) => r.id === rec.id)) records.push(rec);
    return rec;
  };

  const loadTheme = async ({
    query: themeQuery,
    themeKey,
  }: {
    query?: string;
    themeKey?: string;
  }) => {
    const { items } = await fi.searchRequests({
      pageSize: 8,
      query: themeQuery,
      sort: "support",
      themeKey,
    });
    return items;
  };

  const rankedListEnvelope = (
    rows: {
      description: string;
      id: string;
      supportCount: number;
      themeLabel: string | null;
      title: string;
    }[],
    answer: string
  ) => {
    const ids = rows.slice(0, 6).map((r) => {
      pushSignal({
        description: r.description,
        id: r.id,
        supportCount: r.supportCount,
        themeLabel: r.themeLabel,
        title: r.title,
      });
      return signalEntityId(r.id);
    });
    if (ids.length === 0)
      return statusDocument({
        message:
          "No matching signals in the catalog. Try Add feedback or broaden the theme.",
        records: [],
        requestId,
        variant: "empty",
      });
    return sectionStackDocument({
      childExpressions: [
        `Answer(${openUiStringLiteral(answer)}, ${openUiStringList(ids)})`,
        `RankedSignalList(${openUiStringList(ids)}, ${openUiStringLiteral("/review")})`,
      ],
      records,
      requestId,
    });
  };

  const intent = matchFiComposeIntent(query);
  let envelope;

  if (intent === "prioritize-scheduling") {
    let rows = await loadTheme({
      query: "scheduling coverage",
      themeKey: "scheduling_coverage",
    });
    if (rows.length === 0) rows = await loadTheme({ query: "scheduling" });
    envelope = rankedListEnvelope(
      rows,
      "Ranked by supporter count from published Crewday scheduling feedback. Delivery effort is unknown unless noted in decision rationale — open Triage to record a decision."
    );
  } else if (intent === "duplicate-swap") {
    const stripped = duplicateSearchQuery(query);
    const ranked = await fi.searchRequests({
      pageSize: 2,
      query: stripped.length > 1 ? stripped : "shift swap",
      sort: "support",
      themeKey: "shift_swaps",
    });
    const pair = ranked.items.slice(0, 2);
    if (pair.length < 2) {
      envelope = statusDocument({
        message:
          "Not enough published shift-swap signals to compare. Add more feedback or broaden your question.",
        records: [],
        requestId,
        variant: "empty",
      });
    } else {
      for (const row of pair)
        pushSignal({
          description: row.description,
          id: row.id,
          supportCount: row.supportCount,
          themeLabel: row.themeLabel,
          title: row.title,
        });
      const ids = pair.map((r) => signalEntityId(r.id));
      envelope = sectionStackDocument({
        childExpressions: [
          `Answer(${openUiStringLiteral(
            "These Crewday signals describe a shared shift-swap need with different wording. Review before merging — effort and scope are not inferred from similarity alone."
          )}, ${openUiStringList(ids)})`,
          `ComparisonView(${openUiStringLiteral("side-by-side")}, ${openUiStringLiteral("Shared shift-swap need")}, ${openUiStringList(ids)})`,
        ],
        records,
        requestId,
      });
    }
  } else if (intent === "approval-conflict") {
    const { items: rows } = await fi.searchRequests({
      pageSize: 4,
      query: "approval manager employee",
      sort: "support",
    });
    const docIds: string[] = [];
    for (const row of rows) {
      pushSignal({
        description: row.description,
        id: row.id,
        supportCount: row.supportCount,
        themeLabel: row.themeLabel,
        title: row.title,
      });
      records.push(
        evidenceRecord({
          excerpt: row.description.slice(0, 280),
          id: row.id,
          title: row.title,
        })
      );
      docIds.push(evidenceDocId(row.id));
    }
    envelope =
      docIds.length === 0
        ? statusDocument({
            message:
              "No published signals mention approval conflicts. Try searching Feedback or add new evidence.",
            records: [],
            requestId,
            variant: "empty",
          })
        : sectionStackDocument({
            childExpressions: [
              `Answer(${openUiStringLiteral(
                "Managers and employees describe shift approvals differently in the quotes below. Facts come from customer evidence; hypotheses are not recorded decisions."
              )}, ${openUiStringList(docIds)})`,
              ...docIds.map(
                (id) => `EvidenceQuote(${openUiStringLiteral(id)})`
              ),
            ],
            records,
            requestId,
          });
  } else if (intent === "strongest-evidence") {
    const { items: rows } = await fi.searchRequests({
      pageSize: 6,
      sort: "support",
    });
    envelope = rankedListEnvelope(
      rows,
      "Highest supporter counts among published Crewday signals — strong demand, not proof of feasibility or priority without PM judgment."
    );
  } else if (intent === "emerging-month") {
    const [insights, prior] = await Promise.all([
      fi.getInsights({ range: "30d" }),
      fi.getInsights({ range: "90d" }),
    ]);
    records.push(
      metricRecord({
        id: "metric:feedback-30d",
        label: "Published feedback (last 30 days)",
        value: String(insights.sample.publishedCount),
      }),
      metricRecord({
        id: "metric:decisions-30d",
        label: "Decisions recorded (last 30 days)",
        value: String(insights.sample.decisionsInRangeCount),
      }),
      metricRecord({
        id: "metric:queue",
        label: "Open review queue (current)",
        value: String(insights.openQueueCount),
      })
    );
    const emerging = (prior.trends?.themes ?? [])
      .filter((t) => themeCountDelta(t) > 0)
      .toSorted((a, b) => themeCountDelta(b) - themeCountDelta(a))
      .slice(0, 3);
    const top = emerging.at(0) ?? prior.trends?.themes.at(0);
    envelope = sectionStackDocument({
      childExpressions: [
        `DataExplorer(${openUiStringLiteral("metrics-dashboard")}, ${openUiStringList(
          ["metric:feedback-30d", "metric:decisions-30d", "metric:queue"]
        )})`,
        `Answer(${openUiStringLiteral(
          top
            ? `Theme with notable volume in the baseline window: ${top.label} (${top.count} signals). Compare period-over-period in Insights for emerging Crewday themes.`
            : "No theme baseline available for this range."
        )}, [])`,
      ],
      records,
      requestId,
    });
  } else if (intent === "popular-decline") {
    const { items } = await fi.searchRequests({
      pageSize: 12,
      sort: "support",
    });
    const declined = items
      .filter((r) => r.disposition === "decline")
      .slice(0, 6);
    const timelineIds = declined.map((r) => {
      pushSignal({
        description: r.description,
        id: r.id,
        supportCount: r.supportCount,
        themeLabel: r.themeLabel,
        title: r.title,
      });
      records.push(
        evidenceRecord({
          excerpt: r.dispositionRationale ?? r.description.slice(0, 280),
          id: r.id,
          title: r.title,
        })
      );
      return evidenceDocId(r.id);
    });
    envelope =
      timelineIds.length === 0
        ? statusDocument({
            message:
              "No declined signals with recorded rationale match this view. Open Feedback or Triage for disposition history.",
            records: [],
            requestId,
            variant: "empty",
          })
        : sectionStackDocument({
            childExpressions: [
              `Answer(${openUiStringLiteral(
                "Popular demand can still be declined when rationale documents tradeoffs (for example manager approval or compliance). Rationale excerpts are below."
              )}, ${openUiStringList(timelineIds)})`,
              `TimelineView(${openUiStringLiteral("timeline-vertical")}, ${openUiStringList(timelineIds)})`,
            ],
            records,
            requestId,
          });
  } else if (intent === "open-queue-attention") {
    const attention = await fi.listAttentionItems({ limit: 8 });
    const ids = attention.items.map((item) => {
      records.push(
        evidenceRecord({
          excerpt: item.detail,
          id: item.requestId,
          title: item.title,
        })
      );
      return evidenceDocId(item.requestId);
    });
    envelope =
      ids.length === 0
        ? statusDocument({
            message: "Nothing in the queue needs PM attention right now.",
            records: [],
            requestId,
            variant: "empty",
          })
        : sectionStackDocument({
            childExpressions: [
              `Answer(${openUiStringLiteral(
                "Open Crewday requests flagged for review, degraded triage, or unresolved duplicates. Use Triage to record a decision."
              )}, ${openUiStringList(ids)})`,
              `TimelineView(${openUiStringLiteral("timeline-vertical")}, ${openUiStringList(ids)})`,
            ],
            records,
            requestId,
          });
  } else if (intent === "notification-evidence") {
    const rows = await loadTheme({
      query: "shift change notification",
      themeKey: "notifications",
    });
    const docIds: string[] = [];
    for (const row of rows) {
      pushSignal({
        description: row.description,
        id: row.id,
        supportCount: row.supportCount,
        themeLabel: row.themeLabel,
        title: row.title,
      });
      records.push(
        evidenceRecord({
          excerpt: row.description.slice(0, 280),
          id: row.id,
          title: row.title,
        })
      );
      docIds.push(evidenceDocId(row.id));
    }
    envelope =
      docIds.length === 0
        ? statusDocument({
            message:
              "No notification-theme signals found. Try Feedback search or add new evidence.",
            records: [],
            requestId,
            variant: "empty",
          })
        : sectionStackDocument({
            childExpressions: [
              `Answer(${openUiStringLiteral(
                "Customer quotes about shift-change and schedule notifications. Improving alerts is not a recorded decision until Triage captures one."
              )}, ${openUiStringList(docIds)})`,
              ...docIds.map(
                (id) => `EvidenceQuote(${openUiStringLiteral(id)})`
              ),
            ],
            records,
            requestId,
          });
  } else if (intent === "insufficient-evidence") {
    envelope = statusDocument({
      message:
        "Not enough grounded evidence for a confident view. Try a narrower theme, open Feedback, or add new Crewday evidence.",
      records: [],
      requestId,
      variant: "warning",
    });
  } else {
    const search = await fi.searchRequests({
      pageSize: 6,
      query: query.length > 2 ? query : undefined,
      sort: "support",
    });
    if (search.items.length === 0) {
      envelope = statusDocument({
        message:
          "No published signals match. Rephrase your question or capture new feedback.",
        records: [],
        requestId,
        variant: "empty",
      });
    } else {
      const ids = search.items.map((r) => {
        pushSignal({
          description: r.description,
          id: r.id,
          supportCount: r.supportCount,
          themeLabel: r.themeLabel,
          title: r.title,
        });
        return signalEntityId(r.id);
      });
      const synthesized = await synthesizeOpenEndedAnswer({ query, signal });
      let modelCalls = 0;
      if (synthesized) {
        modelCalls = 1;
        envelope = answerDocument({
          body: `${synthesized}\n\nGrounded sources are linked below; this is not a recorded decision.`,
          records,
          requestId,
          sourceIds: ids,
        });
      } else {
        envelope = collectionDocument({
          entityIds: ids,
          records,
          requestId,
        });
      }
      const published = publishComposition({
        emit,
        envelope,
        requestId,
        sequence,
      });
      return {
        events,
        metadata: {
          component: published.ok ? published.compiled.component : undefined,
          composite: published.ok ? published.compiled.composite : null,
          tier: synthesized ? 3 : 1,
          validationOk: published.ok,
        },
        modelCalls,
        parseErrors: published.ok ? 0 : 1,
      };
    }
  }

  const published = publishComposition({
    emit,
    envelope,
    requestId,
    sequence,
  });

  return {
    events,
    metadata: {
      component: published.ok ? published.compiled.component : undefined,
      composite: published.ok ? published.compiled.composite : null,
      tier: 1,
      validationOk: published.ok,
    },
    modelCalls: 0,
    parseErrors: published.ok ? 0 : 1,
  };
};
