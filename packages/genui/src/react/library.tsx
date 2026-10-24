"use client";

import { createLibrary, defineComponent } from "@openuidev/react-lang";
import type { z } from "zod";

import {
  answerPropsSchema,
  collectionGridPropsSchema,
  comparisonViewPropsSchema,
  dataExplorerPropsSchema,
  sectionStackPropsSchema,
  statusMessagePropsSchema,
  timelineViewPropsSchema,
} from "../contract/schemas";
import { useGenuiRecords } from "./record-context";
import {
  AnswerView,
  CollectionGridView,
  ComparisonViewUi,
  DataExplorerView,
  StatusMessageView,
  TimelineViewUi,
} from "./views";

const AnswerComponent = ({
  props,
}: {
  props: z.infer<typeof answerPropsSchema>;
}) => {
  const records = useGenuiRecords();
  return (
    <AnswerView
      body={props.body}
      records={records}
      sourceIds={props.sourceIds}
    />
  );
};

const CollectionGridComponent = ({
  props,
}: {
  props: z.infer<typeof collectionGridPropsSchema>;
}) => {
  const records = useGenuiRecords();
  return (
    <CollectionGridView
      composite={props.composite}
      entityIds={props.entityIds}
      records={records}
    />
  );
};

const ComparisonViewComponent = ({
  props,
}: {
  props: z.infer<typeof comparisonViewPropsSchema>;
}) => {
  const records = useGenuiRecords();
  return <ComparisonViewUi entityIds={props.entityIds} records={records} />;
};

const DataExplorerComponent = ({
  props,
}: {
  props: z.infer<typeof dataExplorerPropsSchema>;
}) => {
  const records = useGenuiRecords();
  return <DataExplorerView metricIds={props.metricIds} records={records} />;
};

const TimelineViewComponent = ({
  props,
}: {
  props: z.infer<typeof timelineViewPropsSchema>;
}) => {
  const records = useGenuiRecords();
  return <TimelineViewUi orderedIds={props.orderedIds} records={records} />;
};

const StatusMessageComponent = ({
  props,
}: {
  props: z.infer<typeof statusMessagePropsSchema>;
}) => <StatusMessageView message={props.message} variant={props.variant} />;

const SectionStackComponent = ({
  props,
}: {
  props: z.infer<typeof sectionStackPropsSchema>;
}) => {
  const records = useGenuiRecords();
  const children = Array.isArray(props.children) ? props.children : [];
  return (
    <div className="flex flex-col gap-8">
      {children.map((child, index) => {
        if (
          !child ||
          typeof child !== "object" ||
          (child as { type?: string }).type !== "element"
        ) {
          return null;
        }
        const element = child as {
          props: Record<string, unknown>;
          typeName: string;
        };
        if (element.typeName === "Answer") {
          return (
            <AnswerView
              body={String(element.props.body ?? "")}
              key={`answer-${index}`}
              records={records}
              sourceIds={
                Array.isArray(element.props.sourceIds)
                  ? element.props.sourceIds.map(String)
                  : []
              }
            />
          );
        }
        if (element.typeName === "DataExplorer") {
          return (
            <DataExplorerView
              key={`metrics-${index}`}
              metricIds={
                Array.isArray(element.props.metricIds)
                  ? element.props.metricIds.map(String)
                  : []
              }
              records={records}
            />
          );
        }
        if (element.typeName === "ComparisonView") {
          return (
            <ComparisonViewUi
              entityIds={
                Array.isArray(element.props.entityIds)
                  ? element.props.entityIds.map(String)
                  : []
              }
              key={`compare-${index}`}
              records={records}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

const Answer = defineComponent({
  component: AnswerComponent,
  description: "Short prose answer with source references.",
  name: "Answer",
  props: answerPropsSchema,
});

const CollectionGrid = defineComponent({
  component: CollectionGridComponent,
  description: "Collection grid.",
  name: "CollectionGrid",
  props: collectionGridPropsSchema,
});

const ComparisonView = defineComponent({
  component: ComparisonViewComponent,
  description: "Comparison view.",
  name: "ComparisonView",
  props: comparisonViewPropsSchema,
});

const DataExplorer = defineComponent({
  component: DataExplorerComponent,
  description: "Metrics explorer.",
  name: "DataExplorer",
  props: dataExplorerPropsSchema,
});

const TimelineView = defineComponent({
  component: TimelineViewComponent,
  description: "Timeline.",
  name: "TimelineView",
  props: timelineViewPropsSchema,
});

const StatusMessage = defineComponent({
  component: StatusMessageComponent,
  description: "Status message.",
  name: "StatusMessage",
  props: statusMessagePropsSchema,
});

const SectionStack = defineComponent({
  component: SectionStackComponent,
  description: "Section stack.",
  name: "SectionStack",
  props: sectionStackPropsSchema,
});

export const flowGenuiReactLibrary = createLibrary({
  components: [
    Answer,
    SectionStack,
    CollectionGrid,
    ComparisonView,
    DataExplorer,
    TimelineView,
    StatusMessage,
  ],
  root: "Answer",
});
