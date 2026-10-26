# Spec: Feature Intelligence — analytics (insights trends)

**Last reviewed:** 2026-10-25  
**Status:** Current  
**Consumers:** `/insights`, `getInsights` (`@repo/fi`), eve `get_insights`  
**Related:** [feature-intelligence.md](./feature-intelligence.md#product-metrics-first) · [feature-intelligence-seed.md](./feature-intelligence-seed.md)

## Goals

- Show how a **product team uses FI over time** on the Meta CTO dashboard-analytics product context.
- Prioritize **existing north-star metrics** plus trend / backlog / demand views from stored columns.
- Distinguish **measured** vs **proxy** metrics; **no** claims that AI improved performance without correction instrumentation.

## Non-goals

- GenUI compose; `/analytics` route; simulation banner.
- AI triage accuracy or harness quality trends.
- `analytics_events` table; client-side timers.
- Weekly series for `medianPmTriageMsProxy` as a headline.

**Correction gap (accepted):** No `intake_theme_overridden` column — do not show “AI correction rate.”

---

## Time range

| Preset | `from` / `to` |
| --- | --- |
| `7d` | \[reference − 7d, reference\] where **reference** = `computedAt` (server clock at query time) |
| `30d` | \[reference − 30d, reference\] |
| `90d` | \[reference − 90d, reference\] — **default for web** |
| `all` | No lower bound; `to` = reference |

**Week buckets:** UTC, **Monday 00:00:00** week start; label `weekStart` as ISO date (date part only).

**Denominators:** Unless noted, **`status = published`** only. Exclude `draft`, `archived`, `triaging`, `pending_confirm` from analytics panels.

---

## North-star cards (scoped rules)

All cards appear on `/insights`. Eve `get_insights` returns **all-time** snapshot only (`range` omitted) — unchanged tool contract.

| Metric | Numerator | Denominator | In-range filter |
| --- | --- | --- | --- |
| **Decision readiness (avg)** | `triage_completed_at − submitted_at` | Rows with both timestamps set | **`submitted_at` ∈ range** |
| **PM triage (median)** | `disposition_at − pm_review_started_at` | Rows with both set | **`disposition_at` ∈ range** |
| **PM triage proxy** | `disposition_at − published_at` | Rows with disposition, no `pm_review_started_at`, `published_at` set | **`disposition_at` ∈ range**; footnote only when `sample.pmTriageN < 2` |
| **Decision capture rate** | Dispositioned with non-empty rationale | Dispositioned + **open queue at `computedAt`** | **Snapshot at query time** (not historical reconstruction) — same as core spec |
| **Intake link rate** | `intake_linked_request_id` NOT NULL | Published | **`published_at` ∈ range** |
| **Open queue (card)** | Published, disposition null | — | **Snapshot at `computedAt`** (ignores range selector) |

**UI note:** Range selector updates readiness, PM triage, intake link, and trend charts; **capture rate** and **open queue** stay live snapshots so a PM demo still moves them after dispositions.

---

## Charts and panels (timestamp per panel)

| Panel | Bucket / filter field | Aggregation |
| --- | --- | --- |
| Submissions per week | **`submitted_at`** | Count where `submitted_at` in week ∩ in range |
| Dispositions per week | **`disposition_at`** | Count by `disposition` enum |
| Open queue at week end | **`published_at`**, **`disposition_at`** | Reconstructed: published with `published_at ≤ weekEnd` AND (`disposition_at` IS NULL OR `disposition_at > weekEnd`) |
| Top themes | **`published_at` ∈ range** | Group `theme_key`; `label` = max `theme_label` or key |
| Theme prior delta | Prior period = same length immediately before `from` | `priorCount` null when `preset = all` |
| Popularity vs judgment | **`disposition_at` ∈ range** | Published rows with support ≥ **15** AND disposition ∈ `{decline, monitor}`; sort support DESC; cap **10** |

---

## API — `getInsights` (single entry point)

Extend `@repo/fi` **`getInsights`**; do **not** add a separate public `getInsightsTrends` export.

```ts
type InsightsRangePreset = "7d" | "30d" | "90d" | "all";

type GetInsightsInput = {
  db: AppDatabase;
  range?: InsightsRangePreset; // default "90d" for web; omit for eve / all-time north stars only
};

type GetInsightsResult = {
  // Existing fields (all-time when range omitted; see north-star table when range set)
  avgDecisionReadinessMs: number | null;
  medianPmTriageMs: number | null;
  medianPmTriageMsProxy: number | null;
  decisionCaptureRate: number | null;
  intakeLinkRate: number | null;
  openQueueCount: number;
  sample: {/* unchanged keys */};
  computedAt: string;
  range: { preset: InsightsRangePreset; from: string; to: string } | null;
  trends: null | {
    weekly: Array<{
      weekStart: string;
      submissions: number;
      dispositions: {
        merge: number;
        monitor: number;
        decline: number;
        needs_discussion: number;
      };
      openQueueEnd: number;
    }>;
    themes: Array<{
      themeKey: string;
      label: string;
      count: number;
      priorCount: number | null;
    }>;
    strategicVsPopular: Array<{
      requestId: string;
      title: string;
      supportCount: number;
      disposition: string;
    }>;
  };
};
```

| Caller | `range` | `trends` |
| --- | --- | --- |
| `/insights` page | **`90d`** default (user can change) | Populated |
| eve `get_insights` | omitted | **`null`** (all-time metrics only) |

---

## UI (`/insights`)

1. Subtitle: metrics from **Postgres**; after `seed:fi`, history reflects **demo seed** (no banner component).
2. **Six** headline metrics: existing four + **PM triage (median)** + keep **open queue** (or grid: 2×3). PM proxy footnote per core spec.
3. Range presets: `7d` | `30d` | `90d` | `all`.
4. Charts: submissions/week, dispositions/week, open queue week-end line.
5. Theme panel with prior delta (hide delta when `all`).
6. Judgment table per selection rule above.

**Charts:** Horizontal CSS bar panels in `insights-dashboard.tsx` (Meta CTO tokens via `@repo/ui` `Card`/`Select`); see [DESIGN.md](../../DESIGN.md).

**Empty range:** Show “No activity in this period” on charts; cards show `—` where undefined.

---

## Acceptance

| ID | Criterion |
| --- | --- |
| AN-1 | 500-row seed + default **90d**: non-empty `trends.weekly`. |
| AN-2 | Changing range updates readiness, intake link, and charts; capture rate + open queue react to live dispositions. |
| AN-3 | No copy claiming AI accuracy or performance improved over time. |
| AN-4 | PM triage card visible; proxy footnote rule unchanged. |
| AN-5 | ≥ 3 themes in theme panel with seed loaded. |
| AN-6 | Unit tests: weekly buckets, queue reconstruction, north-star scoping on fixed rows. |
| AN-7 | `getInsights({ range: "90d" })` returns non-null `trends`; omit `range` → `trends: null`. |
| AN-8 | Judgment table includes ≥ 1 anchor or bulk high-support decline/monitor after seed. |

---

## Approval

**Specified** 2026-10-25 (v2). **Implemented** — [demo depth tasks](../tasks/feature-intelligence-demo-depth.md) complete.
