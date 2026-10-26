import {
  useApp,
  useHostStyleVariables,
} from "@modelcontextprotocol/ext-apps/react";
import { useCallback, useMemo, useState } from "react";

type TabId = "signals" | "patterns" | "review";

const areaForPayload = (data: unknown): TabId => {
  const record = data as Record<string, unknown>;
  if (record.status === "pending_confirm") return "review";
  if (record.range !== undefined || record.metrics !== undefined)
    return "patterns";
  const rows = record.requests;
  if (
    Array.isArray(rows) &&
    rows.length > 0 &&
    typeof rows[0] === "object" &&
    rows[0] !== null &&
    "decisionBrief" in (rows[0] as Record<string, unknown>)
  )
    return "review";
  return "signals";
};

const parseStructured = (result: {
  structuredContent?: unknown;
  content?: { type?: string; text?: string }[];
}) => {
  if (result.structuredContent !== undefined) return result.structuredContent;
  const text = result.content?.find((c) => c.type === "text")?.text;
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
};

const SignalsPanel = ({ data }: { data: unknown }) => {
  if (!data)
    return (
      <p className="empty">
        Waiting for search or detail tool results from the host.
      </p>
    );

  const record = data as Record<string, unknown>;
  if (record.found === false)
    return <p className="empty">No matching signal found.</p>;

  if (Array.isArray(record.requests)) {
    const requests = record.requests as Record<string, unknown>[];
    if (requests.length === 0)
      return <p className="empty">No signals match this query.</p>;
    return (
      <ul className="list">
        {requests.map((r) => (
          <li className="card" key={String(r.id)}>
            <p className="card-title">
              <span className="badge fact">Recorded</span>
              {String(r.title ?? "Untitled")}
            </p>
            <p className="card-meta">
              {r.themeKey ? `Theme ${String(r.themeKey)} · ` : ""}
              Support {String(r.supportCount ?? 0)}
              {r.source ? ` · ${String(r.source)}` : ""}
            </p>
          </li>
        ))}
      </ul>
    );
  }

  if (record.request) {
    const req = record.request as Record<string, unknown>;
    return (
      <article className="card">
        <p className="card-title">
          <span className="badge fact">Signal</span>
          {String(req.title ?? "Untitled")}
        </p>
        <p className="card-meta">Support {String(record.supportCount ?? 0)}</p>
        {req.problemStatement ? (
          <p style={{ fontSize: 12, margin: "8px 0 0" }}>
            {String(req.problemStatement)}
          </p>
        ) : null}
      </article>
    );
  }

  return <pre className="raw">{JSON.stringify(data, null, 2)}</pre>;
};

const PatternsPanel = ({ data }: { data: unknown }) => {
  if (!data)
    return (
      <p className="empty">Run get_insights to populate pattern metrics.</p>
    );

  const record = data as Record<string, unknown>;
  const entries = Object.entries(record).filter(
    ([key]) => !["range", "themes"].includes(key)
  );

  return (
    <>
      {record.range ? (
        <p className="card-meta" style={{ marginBottom: 8 }}>
          Range: <span className="badge fact">{String(record.range)}</span>
        </p>
      ) : null}
      <div className="metrics">
        {entries.slice(0, 6).map(([key, value]) => (
          <div className="metric" key={key}>
            <div className="metric-label">{key}</div>
            <div className="metric-value">{String(value)}</div>
          </div>
        ))}
      </div>
      {Array.isArray(record.themes) && record.themes.length > 0 ? (
        <ul className="list" style={{ marginTop: 10 }}>
          {(record.themes as Record<string, unknown>[]).map((t) => (
            <li className="card" key={String(t.key ?? t.themeKey)}>
              <p className="card-title">{String(t.label ?? t.key)}</p>
              <p className="card-meta">Count {String(t.count ?? "—")}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
};

const ReviewPanel = ({ data }: { data: unknown }) => {
  if (!data)
    return (
      <p className="empty">
        Triage queue or draft preview appears after list_triage_queue or
        submit_request.
      </p>
    );

  const record = data as Record<string, unknown>;

  if (record.status === "pending_confirm") {
    const harness = record.harness as Record<string, unknown> | undefined;
    const degraded = harness?.triage_steps as
      | { degraded?: boolean }
      | undefined;
    return (
      <article className="card">
        <p className="card-title">
          <span className="badge draft">Draft</span>
          Pending confirmation
        </p>
        {degraded?.degraded ? (
          <p>
            <span className="badge degraded">Degraded triage</span>
          </p>
        ) : null}
        <pre className="raw">{JSON.stringify(record, null, 2)}</pre>
      </article>
    );
  }

  const rows = record.requests as Record<string, unknown>[] | undefined;
  if (!rows?.length) return <p className="empty">Review queue is empty.</p>;

  return (
    <ul className="list">
      {rows.map((r) => (
        <li className="card" key={String(r.id)}>
          <p className="card-title">
            <span className="badge suggestion">Needs decision</span>
            {String(r.title ?? "Untitled")}
          </p>
          <p className="card-meta">
            {r.themeKey ? `Theme ${String(r.themeKey)}` : "No theme"}
          </p>
          {r.decisionBrief ? (
            <p style={{ fontSize: 12, margin: "6px 0 0" }}>
              {String(r.decisionBrief)}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
};

export const HunchExplorerApp = () => {
  const [tab, setTab] = useState<TabId>("signals");
  const [signals, setSignals] = useState<unknown>(null);
  const [patterns, setPatterns] = useState<unknown>(null);
  const [review, setReview] = useState<unknown>(null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "Hunch Explorer", version: "1.0.0" },
    capabilities: {},
    onAppCreated: useCallback((created) => {
      created.ontoolresult = (result) => {
        const structured = parseStructured(result);
        const area = areaForPayload(structured);
        if (area === "signals") setSignals(structured);
        if (area === "patterns") setPatterns(structured);
        if (area === "review") setReview(structured);
        setTab(area);
      };
    }, []),
  });

  useHostStyleVariables(app);

  const statusLabel = useMemo(() => {
    if (error) return "Bridge error";
    if (!isConnected) return "Connecting…";
    return "Host linked";
  }, [error, isConnected]);

  const statusClass = (() => {
    if (error) return "err";
    if (isConnected) return "ok";
    return "";
  })();

  return (
    <div className="shell">
      <header>
        <h1>Hunch Explorer</h1>
        <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
      </header>
      <nav className="tabs" aria-label="Explorer sections">
        {(
          [
            ["signals", "Signals"],
            ["patterns", "Patterns"],
            ["review", "Review"],
          ] as const
        ).map(([id, label]) => (
          <button
            className={`tab${tab === id ? " active" : ""}`}
            key={id}
            onClick={() => setTab(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>
      <section className="panel">
        {tab === "signals" ? (
          <>
            <h2>Signals</h2>
            <SignalsPanel data={signals} />
          </>
        ) : null}
        {tab === "patterns" ? (
          <>
            <h2>Patterns</h2>
            <PatternsPanel data={patterns} />
          </>
        ) : null}
        {tab === "review" ? (
          <>
            <h2>Review</h2>
            <ReviewPanel data={review} />
          </>
        ) : null}
      </section>
    </div>
  );
};
