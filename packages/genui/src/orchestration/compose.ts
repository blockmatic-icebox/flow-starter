import { validateCompositionEnvelope } from "../contract/compiler";
import {
  openUiStringList,
  openUiStringLiteral,
} from "../contract/openui-text";
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
  timelineDocument,
} from "./builders";
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

const metricIds = () =>
  acmeCatalogRecords.filter((r) => r.kind === "metric").map((r) => r.id);

const documentIds = () =>
  acmeCatalogRecords.filter((r) => r.kind === "document").map((r) => r.id);

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
      metricIds: metricIds(),
      records,
      requestId,
    });
  }

  if (intent === "product-timeline") {
    return timelineDocument({
      orderedIds: documentIds(),
      records,
      requestId,
    });
  }

  if (intent === "search-products") {
    const hits = entities.filter(() => query.toLowerCase().includes("mobile"))
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
  const wantsCompare = /compare|plan/u.test(query.toLowerCase());
  const children = [answerChild];
  if (wantsMetrics) {
    children.push(
      `DataExplorer("metrics-dashboard", ${openUiStringList(metricIds())})`
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

export const composeQuery = ({
  input,
  onEvent,
  signal,
}: {
  input: ComposeInput;
  onEvent?: (event: ComposeStreamEvent) => void;
  signal?: AbortSignal;
}): ComposeResult => {
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

  if (routed.intent) {
    tier = 1;
    envelope = controlledDocument({ intent: routed.intent, query, requestId });
  } else if (tier === 2) {
    envelope = declarativeCompound({ query, requestId });
  } else {
    tier = 3;
    envelope = answerDocument({
      body: "Open-ended composition is available when a model provider is configured; using grounded answer fallback.",
      records: acmeCatalogRecords,
      requestId,
      sourceIds: ["document:api-overview"],
    });
  }

  emit({ envelope, requestId, sequence, type: "partial" });
  sequence += 1;

  const validated = validateCompositionEnvelope({ envelope });
  if (!validated.ok) {
    emit({
      message: "Composition failed validation.",
      requestId,
      sequence,
      type: "error",
    });
    return {
      events,
      metadata: {
        tier,
        validationOk: false,
      },
      modelCalls: 0,
      parseErrors: 1,
    };
  }

  emit({ envelope, requestId, sequence, type: "complete" });
  sequence += 1;

  return {
    events,
    metadata: {
      component: validated.compiled.component,
      composite: validated.compiled.composite,
      tier,
      validationOk: true,
    },
    modelCalls: 0,
    parseErrors: 0,
  };
};
