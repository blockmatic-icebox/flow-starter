import { validateCompositionEnvelope } from "../contract/compiler";
import { openUiStringList, openUiStringLiteral } from "../contract/openui-text";
import type { CompositionEnvelope } from "../core/envelope";
import { MAX_QUERY_CODE_POINTS } from "../core/limits";
import type { CompositionTier } from "../core/tiers";
import { acmeCatalogRecords } from "../fixtures/acme-catalog";
import {
  answerDocument,
  collectionDocument,
  comparisonDocument,
  dataExplorerDocument,
  sectionStackDocument,
  statusDocument,
  supportDashboardDocument,
  timelineDocument,
} from "./builders";
import { synthesizeOpenUiComposition } from "./generate-openui";
import { synthesizeOpenEndedAnswer } from "./model";
import { defaultEntityIds, routeQuery } from "./routing";
import type { ComposeStreamEvent } from "./stream";

export interface ComposeInput {
  clientRequestId: string;
  query: string;
  version: number;
}

export interface ComposeResult {
  events: ComposeStreamEvent[];
  metadata: {
    component?: string;
    composite?: string | null;
    tier: CompositionTier;
    validationOk: boolean;
  };
  modelCalls: number;
  parseErrors: number;
}

const queryCodePoints = (query: string) => [...query].length;

const metricIds = acmeCatalogRecords
  .filter((record) => record.kind === "metric")
  .map((record) => record.id);

const documentIds = acmeCatalogRecords
  .filter((record) => record.kind === "document")
  .map((record) => record.id);

const controlledDocument = ({
  intent,
  query,
  requestId,
}: {
  intent: NonNullable<ReturnType<typeof routeQuery>["intent"]>;
  query: string;
  requestId: string;
}): CompositionEnvelope => {
  const records = acmeCatalogRecords;
  const entities = defaultEntityIds();

  if (intent === "injection-guard") {
    return answerDocument({
      body: "I can only use approved UI components and grounded catalog records.",
      records,
      requestId,
      sourceIds: [],
    });
  }

  if (intent === "insufficient-data") {
    return statusDocument({
      message: "That capability is not in the registered component catalog.",
      records,
      requestId,
      variant: "warning",
    });
  }

  if (intent === "compare-plans") {
    return comparisonDocument({
      entityIds: ["entity:orbit-plan", "entity:nova-plan"],
      records,
      requestId,
    });
  }

  if (intent === "show-metrics") {
    return dataExplorerDocument({
      metricIds,
      records,
      requestId,
    });
  }

  if (intent === "support-dashboard") {
    return supportDashboardDocument({ requestId });
  }

  if (intent === "product-timeline") {
    return timelineDocument({
      orderedIds: documentIds,
      records,
      requestId,
    });
  }

  if (intent === "search-products") {
    const hits = query.toLowerCase().includes("mobile")
      ? ["entity:pulse-mobile"]
      : entities.slice(0, 2);
    return {
      ...collectionDocument({ entityIds: hits, records, requestId }),
      openuiText: `root = SearchResults("results-with-filters", ${openUiStringList(hits)}, ${openUiStringLiteral(query)})`,
    };
  }

  return collectionDocument({
    entityIds: entities,
    records,
    requestId,
  });
};

export const publishComposition = ({
  emit,
  envelope,
  requestId,
  sequence,
}: {
  emit: (event: ComposeStreamEvent) => void;
  envelope: CompositionEnvelope;
  requestId: string;
  sequence: number;
}) => {
  const validated = validateCompositionEnvelope({ envelope });
  if (!validated.ok) {
    emit({
      message: "Composition failed validation.",
      requestId,
      sequence,
      type: "error",
    });
    return { ok: false as const, reason: validated.reason };
  }

  emit({ envelope, requestId, sequence, type: "partial" });
  emit({ envelope, requestId, sequence: sequence + 1, type: "complete" });
  return { compiled: validated.compiled, ok: true as const };
};

const declarativeCompound = ({
  query,
  requestId,
}: {
  query: string;
  requestId: string;
}): CompositionEnvelope => {
  const records = acmeCatalogRecords;
  const answerChild = `Answer(${openUiStringLiteral(
    "Acme Analytics ships ingestion, dashboards, and mobile insights."
  )}, ${openUiStringList(["document:api-overview"])})`;
  const wantsMetrics = /metric|revenue|chart/u.test(query.toLowerCase());
  const normalized = query.toLowerCase();
  const wantsCompare =
    /compare|versus|vs\b/u.test(normalized) &&
    /plan|orbit|nova/u.test(normalized);
  const children = [answerChild];
  if (wantsMetrics) {
    children.push(
      `DataExplorer("metrics-dashboard", ${openUiStringList(metricIds)})`
    );
  }
  if (wantsCompare) {
    children.push(
      `ComparisonView("side-by-side", "", ${openUiStringList([
        "entity:orbit-plan",
        "entity:nova-plan",
      ])})`
    );
  }
  if (children.length === 1) {
    return answerDocument({
      body: "Acme Analytics ships ingestion, dashboards, and mobile insights.",
      records,
      requestId,
      sourceIds: ["document:api-overview"],
    });
  }
  return sectionStackDocument({
    childExpressions: children,
    records,
    requestId,
  });
};

export const composeQuery = async ({
  input,
  onEvent,
  signal,
}: {
  input: ComposeInput;
  onEvent?: (event: ComposeStreamEvent) => void;
  signal?: AbortSignal;
}): Promise<ComposeResult> => {
  const query = input.query.trim();
  if (!query || queryCodePoints(query) > MAX_QUERY_CODE_POINTS) {
    throw new Error("invalid-query");
  }

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

  const routed = routeQuery(query);
  let envelope: CompositionEnvelope;
  let tier: CompositionTier = routed.tier;
  let modelCalls = 0;

  if (routed.intent) {
    tier = 1;
    envelope = controlledDocument({ intent: routed.intent, query, requestId });
  } else if (tier === 2) {
    envelope = declarativeCompound({ query, requestId });
  } else {
    tier = 3;
    const generated = await synthesizeOpenUiComposition({
      query,
      requestId,
      signal,
    });
    if (generated) {
      modelCalls = 1;
      envelope = generated;
    } else {
      const synthesized = await synthesizeOpenEndedAnswer({ query, signal });
      if (synthesized) modelCalls = 1;
      envelope = answerDocument({
        body:
          synthesized ??
          "Generation requires AI_GATEWAY_API_KEY for open layouts, or try a supported prompt such as customer support dashboard, metrics, or plan comparison.",
        records: acmeCatalogRecords,
        requestId,
        sourceIds: [],
      });
    }
  }

  const published = publishComposition({
    emit,
    envelope,
    requestId,
    sequence,
  });
  if (!published.ok) {
    return {
      events,
      metadata: { tier, validationOk: false },
      modelCalls: 0,
      parseErrors: 1,
    };
  }

  return {
    events,
    metadata: {
      component: published.compiled.component,
      composite: published.compiled.composite,
      tier,
      validationOk: true,
    },
    modelCalls,
    parseErrors: 0,
  };
};
