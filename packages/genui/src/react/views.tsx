"use client";

import type { GroundedRecord } from "../core/envelope";

const recordTitle = (records: GroundedRecord[], id: string) =>
  records.find((record) => record.id === id)?.kind === "entity"
    ? (records.find((record) => record.id === id) as { title: string }).title
    : id;

export const AnswerView = ({
  body,
  records,
  sourceIds,
}: {
  body: string;
  records: GroundedRecord[];
  sourceIds: string[];
}) => (
  <article className="space-y-3">
    <p className="text-foreground text-sm leading-relaxed">{body}</p>
    {sourceIds.length > 0 ? (
      <ul className="text-muted-foreground flex flex-wrap gap-2 text-xs">
        {sourceIds.map((id) => (
          <li className="border-border rounded-md border px-2 py-1" key={id}>
            {recordTitle(records, id)}
          </li>
        ))}
      </ul>
    ) : null}
  </article>
);

export const CollectionGridView = ({
  composite,
  entityIds,
  records,
}: {
  composite: string;
  entityIds: string[];
  records: GroundedRecord[];
}) => (
  <section className="space-y-2">
    <p className="text-muted-foreground text-xs tracking-wide uppercase">
      {composite}
    </p>
    <ul className="grid gap-3 sm:grid-cols-2">
      {entityIds.map((id) => (
        <li className="border-border rounded-lg border p-3" key={id}>
          <h3 className="font-medium">{recordTitle(records, id)}</h3>
        </li>
      ))}
    </ul>
  </section>
);

export const ComparisonViewUi = ({
  entityIds,
  records,
}: {
  entityIds: string[];
  records: GroundedRecord[];
}) => (
  <div className="grid gap-3 md:grid-cols-2">
    {entityIds.map((id) => (
      <div className="border-border rounded-lg border p-4" key={id}>
        <h3 className="font-semibold">{recordTitle(records, id)}</h3>
      </div>
    ))}
  </div>
);

export const DataExplorerView = ({
  metricIds,
  records,
}: {
  metricIds: string[];
  records: GroundedRecord[];
}) => (
  <dl className="grid gap-3 sm:grid-cols-3">
    {metricIds.map((id) => {
      const metric = records.find((record) => record.id === id);
      if (!metric || metric.kind !== "metric") return null;
      return (
        <div className="border-border rounded-lg border p-3" key={id}>
          <dt className="text-muted-foreground text-xs">{metric.label}</dt>
          <dd className="text-lg font-semibold">
            {metric.value}
            {metric.unit ? ` ${metric.unit}` : ""}
          </dd>
        </div>
      );
    })}
  </dl>
);

export const TimelineViewUi = ({
  orderedIds,
  records,
}: {
  orderedIds: string[];
  records: GroundedRecord[];
}) => (
  <ol className="border-border space-y-2 border-l pl-4">
    {orderedIds.map((id) => {
      const doc = records.find((record) => record.id === id);
      return (
        <li className="text-sm" key={id}>
          <span className="font-medium">
            {doc && doc.kind === "document" ? doc.title : id}
          </span>
          {doc && doc.kind === "document" ? (
            <p className="text-muted-foreground">{doc.excerpt}</p>
          ) : null}
        </li>
      );
    })}
  </ol>
);

export const StatusMessageView = ({
  message,
  variant,
}: {
  message: string;
  variant: string;
}) => (
  <output className="border-border bg-muted/40 block rounded-md border px-3 py-2 text-sm">
    <span className="font-medium">{variant}: </span>
    {message}
  </output>
);
