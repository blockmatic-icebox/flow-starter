export type InsightsRangePreset = "7d" | "30d" | "90d" | "all";

const presetDays: Record<Exclude<InsightsRangePreset, "all">, number> = {
  "30d": 30,
  "7d": 7,
  "90d": 90,
};

export const resolveInsightsRange = ({
  computedAt,
  preset,
}: {
  computedAt: Date;
  preset: InsightsRangePreset;
}) => {
  const to = computedAt;
  if (preset === "all") {
    return {
      from: null as string | null,
      preset,
      to: to.toISOString(),
    };
  }

  const days = presetDays[preset];
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    from: from.toISOString(),
    preset,
    to: to.toISOString(),
  };
};

export const inRange = ({
  date,
  from,
  to,
}: {
  date: Date | null;
  from: Date | null;
  to: Date;
}) => {
  if (!date) return false;
  if (!from) return date <= to;
  return date >= from && date <= to;
};
