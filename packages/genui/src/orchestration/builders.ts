import {
  openUiStringList,
  openUiStringLiteral,
} from "../contract/openui-text";
import type { CompositionEnvelope, GroundedRecord } from "../core/envelope";
import { GENUI_LIBRARY_VERSION } from "../core/envelope";
import type { CompositeName } from "../registry/composites";
import { chooseCollectionComposite } from "../registry/composites";

export const answerDocument = ({
  body,
  records,
  requestId,
  sourceIds = [],
}: {
  body: string;
  records: GroundedRecord[];
  requestId: string;
  sourceIds?: string[];
}) => ({
  fallbackText: body,
  libraryVersion: GENUI_LIBRARY_VERSION,
  openuiText: `root = Answer(${openUiStringLiteral(body)}, ${openUiStringList(sourceIds)})`,
  records,
  requestId,
});

export const collectionDocument = ({
  composite,
  entityIds,
  records,
  requestId,
}: {
  composite?: CompositeName;
  entityIds: string[];
  records: GroundedRecord[];
  requestId: string;
}) => {
  const layout = composite ?? chooseCollectionComposite({ entityIds });
  return {
    fallbackText: `Showing ${entityIds.length} items.`,
    libraryVersion: GENUI_LIBRARY_VERSION,
    openuiText: `root = CollectionGrid(${openUiStringLiteral(layout)}, ${openUiStringList(entityIds)})`,
    records,
    requestId,
  } satisfies CompositionEnvelope;
};

export const comparisonDocument = ({
  dimension,
  entityIds,
  records,
  requestId,
}: {
  dimension?: string;
  entityIds: string[];
  records: GroundedRecord[];
  requestId: string;
}) => ({
  fallbackText: `Comparing ${entityIds.length} items.`,
  libraryVersion: GENUI_LIBRARY_VERSION,
  openuiText: `root = ComparisonView("side-by-side", ${openUiStringLiteral(dimension ?? "")}, ${openUiStringList(entityIds)})`,
  records,
  requestId,
});

export const dataExplorerDocument = ({
  metricIds,
  records,
  requestId,
}: {
  metricIds: string[];
  records: GroundedRecord[];
  requestId: string;
}) => ({
  fallbackText: "Metrics overview.",
  libraryVersion: GENUI_LIBRARY_VERSION,
  openuiText: `root = DataExplorer("metrics-dashboard", ${openUiStringList(metricIds)})`,
  records,
  requestId,
});

export const timelineDocument = ({
  orderedIds,
  records,
  requestId,
}: {
  orderedIds: string[];
  records: GroundedRecord[];
  requestId: string;
}) => ({
  fallbackText: "Timeline.",
  libraryVersion: GENUI_LIBRARY_VERSION,
  openuiText: `root = TimelineView("timeline-vertical", ${openUiStringList(orderedIds)})`,
  records,
  requestId,
});

export const sectionStackDocument = ({
  childExpressions,
  records,
  requestId,
}: {
  childExpressions: string[];
  records: GroundedRecord[];
  requestId: string;
}) => ({
  fallbackText: "Multiple sections.",
  libraryVersion: GENUI_LIBRARY_VERSION,
  openuiText: `root = SectionStack([${childExpressions.join(", ")}])`,
  records,
  requestId,
});

export const statusDocument = ({
  message,
  records,
  requestId,
  variant,
}: {
  message: string;
  records: GroundedRecord[];
  requestId: string;
  variant: "loading" | "empty" | "warning" | "error";
}) => ({
  fallbackText: message,
  libraryVersion: GENUI_LIBRARY_VERSION,
  openuiText: `root = StatusMessage(${openUiStringLiteral(variant)}, ${openUiStringLiteral(message)})`,
  records,
  requestId,
});
