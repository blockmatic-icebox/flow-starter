import type { AppDatabase } from "@repo/db";
import { getInsights, searchRequests } from "@repo/fi";
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

export interface ComposeFiDeps {
  getInsights: (args: GetInsightsInput) => ReturnType<typeof getInsights>;
  searchRequests: (
    args: SearchRequestsInput
  ) => ReturnType<typeof searchRequests>;
}

const defaultDeps = (db: AppDatabase): ComposeFiDeps => ({
  getInsights: (args) => getInsights({ ...args, db }),
  searchRequests: (args) => searchRequests({ ...args, db }),
});

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

  const loadTheme = async (themeHint: RegExp) => {
    const { items } = await fi.searchRequests({
      pageSize: 50,
      sort: "support",
    });
    return items.filter(
      (row) =>
        themeHint.test(row.themeLabel ?? "") ||
        themeHint.test(row.title) ||
        themeHint.test(row.description)
    );
  };

  const intent = matchFiComposeIntent(query);
  let envelope;

  if (intent === "integration-failure") {
    const rows = await loadTheme(/integrat/iu);
    const sourceIds = rows.slice(0, 6).map((r) => signalEntityId(r.id));
    for (const row of rows.slice(0, 6))
      pushSignal({
        description: row.description,
        id: row.id,
        supportCount: row.supportCount,
        themeLabel: row.themeLabel,
        title: row.title,
      });
    envelope = sectionStackDocument({
      childExpressions: [
        `StatusMessage(${openUiStringLiteral(
          "Analysis could not complete. Your prompt is preserved below. Review source signals manually or retry when the model is available."
        )}, ${openUiStringLiteral("warning")})`,
        `CollectionGrid(${openUiStringLiteral("grid-cards")}, ${openUiStringList(sourceIds)})`,
      ],
      records,
      requestId,
    });
  } else if (intent === "duplicates") {
    const ranked = await fi.searchRequests({ pageSize: 2, sort: "support" });
    const pair = ranked.items.slice(0, 2);
    if (pair.length < 2) {
      envelope = statusDocument({
        message:
          "Not enough published signals to compare. Add more feedback or broaden your question.",
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
            "These signals describe a shared need with different wording. Review before merging — effort and scope are not inferred from similarity alone."
          )}, ${openUiStringList(ids)})`,
          `ComparisonView(${openUiStringLiteral("side-by-side")}, ${openUiStringLiteral("Shared need")}, ${openUiStringList(ids)})`,
        ],
        records,
        requestId,
      });
    }
  } else if (intent === "public-links") {
    const { items: linkRows } = await fi.searchRequests({
      pageSize: 4,
      query: "link",
      sort: "support",
    });
    const docIds: string[] = [];
    for (const row of linkRows) {
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
    envelope = sectionStackDocument({
      childExpressions: [
        `Answer(${openUiStringLiteral(
          "Segmented evidence below. Facts come from customer quotes; hypotheses are not recorded decisions."
        )}, ${openUiStringList(docIds)})`,
        ...docIds.map((id) => `EvidenceQuote(${openUiStringLiteral(id)})`),
      ],
      records,
      requestId,
    });
  } else if (intent === "monthly-change") {
    const insights = await fi.getInsights({ range: "30d" });
    const prior = await fi.getInsights({ range: "90d" });
    records.push(
      metricRecord({
        id: "metric:signals-30d",
        label: "Signals received (30d)",
        trend: "up",
        value: String(insights.sample.publishedCount),
      }),
      metricRecord({
        id: "metric:decisions-30d",
        label: "Decisions recorded (30d)",
        value: String(insights.sample.dispositionWithRationaleCount),
      }),
      metricRecord({
        id: "metric:queue",
        label: "Awaiting review (now)",
        value: String(insights.openQueueCount),
      })
    );
    const top = prior.trends?.themes.at(0);
    envelope = sectionStackDocument({
      childExpressions: [
        `DataExplorer(${openUiStringLiteral("metrics-dashboard")}, ${openUiStringList(
          ["metric:signals-30d", "metric:decisions-30d", "metric:queue"]
        )})`,
        `Answer(${openUiStringLiteral(
          top
            ? `Largest theme in the baseline window: ${top.label} (${top.count} signals). Use linked signals for drill-down.`
            : "No theme baseline available for this range."
        )}, [])`,
      ],
      records,
      requestId,
    });
  } else if (intent === "recent-decisions") {
    const recent = await fi.searchRequests({
      pageSize: 12,
      sort: "published_at",
    });
    const decided = recent.items.filter(
      (r) => r.disposition && r.dispositionRationale
    );
    const timelineIds = decided.slice(0, 8).map((r) => {
      records.push(
        evidenceRecord({
          excerpt: `${r.disposition?.replaceAll("_", " ")} — ${r.dispositionRationale ?? ""}`,
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
              "No recorded decisions with rationale in the latest published signals.",
            records: [],
            requestId,
            variant: "empty",
          })
        : sectionStackDocument({
            childExpressions: [
              `Answer(${openUiStringLiteral(
                "Recorded decisions below include rationale. Reviewing feedback does not mean a feature shipped."
              )}, ${openUiStringList(timelineIds)})`,
              `TimelineView(${openUiStringLiteral("timeline-vertical")}, ${openUiStringList(timelineIds)})`,
            ],
            records,
            requestId,
          });
  } else if (intent === "prioritize-reporting") {
    const rows = await loadTheme(/report|export/iu);
    const fallbackSearch = await fi.searchRequests({
      pageSize: 8,
      sort: "support",
    });
    const ranked = rows.length > 0 ? rows : fallbackSearch.items;
    const ids = ranked.slice(0, 6).map((r) => {
      pushSignal({
        description: r.description,
        id: r.id,
        supportCount: r.supportCount,
        themeLabel: r.themeLabel,
        title: r.title,
      });
      return signalEntityId(r.id);
    });
    envelope =
      ids.length === 0
        ? statusDocument({
            message:
              "No matching signals in the catalog. Try Add feedback or broaden the theme.",
            records: [],
            requestId,
            variant: "empty",
          })
        : sectionStackDocument({
            childExpressions: [
              `Answer(${openUiStringLiteral(
                "Ranked by supporter count from published signals. Delivery effort is unknown unless noted in decision rationale — open Review to record a decision."
              )}, ${openUiStringList(ids)})`,
              `RankedSignalList(${openUiStringList(ids)}, ${openUiStringLiteral("/review")})`,
            ],
            records,
            requestId,
          });
  } else if (intent === "insufficient-evidence") {
    envelope = statusDocument({
      message:
        "Not enough grounded evidence for a confident view. Try a narrower theme, open Signals, or add feedback.",
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
