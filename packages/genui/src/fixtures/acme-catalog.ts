import type { GroundedRecord } from "../core/envelope";

/** Fictional Acme Analytics domain — not tied to any production site. */
export const acmeCatalogRecords: GroundedRecord[] = [
  {
    id: "entity:orbit-plan",
    kind: "entity",
    summary: "Team plan with shared dashboards.",
    tags: ["plan", "saas"],
    title: "Orbit Plan",
    url: "https://example.invalid/plans/orbit",
  },
  {
    id: "entity:nova-plan",
    kind: "entity",
    summary: "Enterprise plan with SSO.",
    tags: ["plan", "enterprise"],
    title: "Nova Plan",
    url: "https://example.invalid/plans/nova",
  },
  {
    id: "entity:relay-connector",
    kind: "entity",
    summary: "Streams events into Acme warehouses.",
    tags: ["integration"],
    title: "Relay Connector",
    url: "https://example.invalid/products/relay",
  },
  {
    id: "entity:pulse-mobile",
    kind: "entity",
    summary: "Mobile metrics companion app.",
    tags: ["mobile"],
    title: "Pulse Mobile",
    url: "https://example.invalid/products/pulse",
  },
  {
    excerpt: "Shipped chart builder, CSV export, and audit logs.",
    id: "document:release-2026-q3",
    kind: "document",
    revisedAt: "2026-09-15",
    title: "Q3 2026 Release Notes",
    url: "https://example.invalid/docs/releases/2026-q3",
  },
  {
    excerpt: "REST and webhook ingestion for custom pipelines.",
    id: "document:api-overview",
    kind: "document",
    revisedAt: "2026-08-01",
    title: "API Overview",
    url: "https://example.invalid/docs/api",
  },
  {
    id: "metric:mrr",
    kind: "metric",
    label: "Monthly recurring revenue",
    trend: "up",
    unit: "USD",
    value: "4.2M",
  },
  {
    id: "metric:active-teams",
    kind: "metric",
    label: "Active teams",
    trend: "up",
    value: "18,400",
  },
  {
    id: "metric:churn",
    kind: "metric",
    label: "Logo churn",
    trend: "down",
    unit: "%",
    value: "1.8",
  },
  {
    id: "media:architecture-diagram",
    kind: "media",
    mimeType: "image/svg+xml",
    title: "Ingestion architecture",
    url: "https://example.invalid/media/ingest.svg",
  },
];

export const acmeEntityIds = acmeCatalogRecords
  .filter((record) => record.kind === "entity")
  .map((record) => record.id);
