import type { GroundedRecord } from "@repo/genui";

export const signalEntityId = (id: string) => `signal:${id}`;
export const evidenceDocId = (id: string) => `evidence:${id}`;

export const signalRecord = ({
  description,
  id,
  supportCount,
  themeLabel,
  title,
}: {
  description: string;
  id: string;
  supportCount: number;
  themeLabel: string | null;
  title: string;
}): GroundedRecord => ({
  id: signalEntityId(id),
  kind: "entity",
  summary: `${supportCount} supporters${themeLabel ? ` · ${themeLabel}` : ""}. ${description.slice(0, 160)}`,
  tags: themeLabel ? [themeLabel] : undefined,
  title,
  url: `/signals/${id}`,
});

export const evidenceRecord = ({
  excerpt,
  id,
  title,
}: {
  excerpt: string;
  id: string;
  title: string;
}): GroundedRecord => ({
  excerpt,
  id: evidenceDocId(id),
  kind: "document",
  title,
  url: `/signals/${id}`,
});

export const metricRecord = ({
  id,
  label,
  trend,
  unit,
  value,
}: {
  id: string;
  label: string;
  trend?: "up" | "down" | "flat";
  unit?: string;
  value: string;
}): GroundedRecord => ({
  id,
  kind: "metric",
  label,
  trend,
  unit,
  value,
});
