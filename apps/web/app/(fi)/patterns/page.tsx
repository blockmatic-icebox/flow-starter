import { getDb, getInsights } from "@repo/fi";
import type { InsightsRangePreset } from "@repo/fi";

import { PatternsDashboard } from "./patterns-dashboard";

const isRange = (value: string | undefined): value is InsightsRangePreset =>
  value === "7d" || value === "30d" || value === "90d" || value === "all";

export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = isRange(params.range) ? params.range : "90d";
  const insights = await getInsights({ db: getDb(), range });

  return <PatternsDashboard insights={insights} range={range} />;
}
