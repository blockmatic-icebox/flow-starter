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

export const SearchResultsView = ({
  composite,
  entityIds,
  query,
  records,
}: {
  composite: string;
  entityIds: string[];
  query: string;
  records: GroundedRecord[];
}) => (
  <section className="space-y-3">
    <header className="space-y-1">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">
        {composite}
      </p>
      <p className="text-sm">
        Results for <span className="font-medium">&ldquo;{query}&rdquo;</span>
      </p>
    </header>
    <ul className="grid gap-3 sm:grid-cols-2">
      {entityIds.map((id) => (
        <li className="border-border rounded-lg border p-3" key={id}>
          <h3 className="font-medium">{recordTitle(records, id)}</h3>
        </li>
      ))}
    </ul>
  </section>
);

export const DetailViewUi = ({
  composite,
  records,
  sourceId,
}: {
  composite: string;
  records: GroundedRecord[];
  sourceId: string;
}) => {
  const record = records.find((item) => item.id === sourceId);
  if (!record) return null;
  if (record.kind === "entity") {
    return (
      <article className="space-y-2">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {composite}
        </p>
        <h2 className="text-xl font-semibold">{record.title}</h2>
        {record.summary ? (
          <p className="text-muted-foreground text-sm">{record.summary}</p>
        ) : null}
      </article>
    );
  }
  if (record.kind === "document") {
    return (
      <article className="space-y-2">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {composite}
        </p>
        <h2 className="text-xl font-semibold">{record.title}</h2>
        <p className="text-sm leading-relaxed">{record.excerpt}</p>
      </article>
    );
  }
  return (
    <article className="space-y-2">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">
        {composite}
      </p>
      <h2 className="text-xl font-semibold">{sourceId}</h2>
    </article>
  );
};

export const DocumentationBlockView = ({
  composite,
  documentId,
  records,
}: {
  composite: string;
  documentId: string;
  records: GroundedRecord[];
}) => {
  const doc = records.find((record) => record.id === documentId);
  if (!doc || doc.kind !== "document") return null;
  return (
    <article className="space-y-3">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">
          {composite}
        </p>
        <h2 className="font-semibold">{doc.title}</h2>
      </header>
      <p className="text-sm leading-relaxed">{doc.excerpt}</p>
      {composite === "code-and-prose" ? (
        <pre className="border-border bg-muted/30 overflow-x-auto rounded-md border p-3 text-xs">
          <code>{doc.excerpt}</code>
        </pre>
      ) : null}
    </article>
  );
};

export const FilePreviewView = ({
  composite,
  mediaId,
  records,
}: {
  composite: string;
  mediaId: string;
  records: GroundedRecord[];
}) => {
  const media = records.find((record) => record.id === mediaId);
  if (!media || media.kind !== "media") return null;
  const isImage = media.mimeType.startsWith("image/");
  return (
    <figure className="space-y-2">
      <figcaption className="text-muted-foreground text-xs tracking-wide uppercase">
        {composite}
      </figcaption>
      <div className="border-border rounded-lg border p-4">
        <p className="font-medium">{media.title}</p>
        <p className="text-muted-foreground text-xs">{media.mimeType}</p>
        <a
          className="mt-3 inline-block text-sm underline"
          href={media.url}
          rel="noreferrer"
          target="_blank"
        >
          {isImage ? `Preview ${media.title}` : "Open file"}
        </a>
      </div>
    </figure>
  );
};

export const InteractiveFormView = ({
  composite,
  formId,
}: {
  composite: string;
  formId: string;
}) => (
  <section className="space-y-2">
    <p className="text-muted-foreground text-xs tracking-wide uppercase">
      {composite}
    </p>
    <StatusMessageView
      message={`Form "${formId}" is not wired on this host. Register a privileged submit action before enabling submission.`}
      variant="warning"
    />
  </section>
);
