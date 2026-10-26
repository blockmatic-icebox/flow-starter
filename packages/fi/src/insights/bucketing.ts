import type { InsightRow } from "../metrics/compute-insights";

const msDay = 24 * 60 * 60 * 1000;

export const startOfUtcWeek = (date: Date) => {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
};

export const weekStartsBetween = ({ from, to }: { from: Date; to: Date }) => {
  const weeks: Date[] = [];
  let cursor = startOfUtcWeek(from);
  const end = startOfUtcWeek(to);
  while (cursor <= end) {
    weeks.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + 7 * msDay);
  }
  return weeks;
};

export const weekEnd = (weekStart: Date) =>
  new Date(weekStart.getTime() + 7 * msDay - 1);

export const countOpenQueueAt = ({
  rows,
  when,
}: {
  rows: InsightRow[];
  when: Date;
}) =>
  rows.filter((r) => {
    if (r.status !== "published") return false;
    if (!r.publishedAt || r.publishedAt > when) return false;
    if (!r.disposition) return true;
    if (!r.dispositionAt) return true;
    return r.dispositionAt > when;
  }).length;

export const buildWeeklySeries = ({
  from,
  published,
  to,
}: {
  from: Date;
  published: InsightRow[];
  to: Date;
}) => {
  const weeks = weekStartsBetween({ from, to });

  return weeks.map((weekStart) => {
    const weekEndAt = weekEnd(weekStart);
    const submissions = published.filter(
      (r) =>
        r.submittedAt &&
        r.submittedAt >= weekStart &&
        r.submittedAt <= weekEndAt
    ).length;

    const dispositions = {
      decline: 0,
      merge: 0,
      monitor: 0,
      needs_discussion: 0,
    };

    for (const r of published) {
      if (!r.dispositionAt || r.dispositionAt < weekStart) continue;
      if (r.dispositionAt > weekEndAt) continue;
      if (!r.disposition) continue;
      if (r.disposition in dispositions) {
        dispositions[r.disposition as keyof typeof dispositions] += 1;
      }
    }

    return {
      dispositions,
      openQueueEnd: countOpenQueueAt({ rows: published, when: weekEndAt }),
      submissions,
      weekStart: weekStart.toISOString().slice(0, 10),
    };
  });
};
