# Spec: Feature Intelligence — seed data (eve + demo)

**Last reviewed:** 2026-10-25  
**Status:** Current  
**Consumers:** `@repo/fi` seed command, web UI, **eve** tool smoke tests, `/insights` trends  
**Related:** [feature-intelligence.md](./feature-intelligence.md) · [feature-intelligence-analytics.md](./feature-intelligence-analytics.md) · [eve agent spec](./feature-intelligence-eve-agent.md)

## Goals

- **Deterministic** dataset: stable **anchor** UUIDs (FR-001–FR-011) plus **bulk** rows from a fixed RNG seed.
- **Idempotent** re-run: `pnpm seed:fi` **deletes all FI tables** and reloads (**500** requests total).
- Cover every **eve tool** in [AG-1–AG-6](./feature-intelligence-eve-agent.md#acceptance-criteria-agent-slice) without calling the live triage model on bulk rows.
- Enough volume for duplicate retrieval, lexical search, PM queue, and **90-day** analytics demos.
- Coherent narrative: duplicates, related-but-separate items, emerging themes, ambiguous copy, **high support / low strategic** dispositions, imperfect timing.

## Volume and manifest (canonical)

All counts are **exact** after seed; tests import from `packages/fi/seed/manifest.ts`.

| Constant | Value |
| --- | --- |
| `TOTAL_REQUESTS` | **500** |
| `RNG_SEED` | **`fi-demo-v1`** |
| `SEED_REFERENCE_ISO` | **`2026-10-25T12:00:00.000Z`** — all relative timestamps anchor here (not `Date.now()`). |
| `HISTORY_DAYS` | **90** — `submitted_at` ∈ \[reference − 90d, reference\] |

### Status breakdown (500 total)

| Status            |   Count | Notes                         |
| ----------------- | ------: | ----------------------------- |
| `published`       | **462** | Includes open + dispositioned |
| `pending_confirm` |   **1** | FR-011 only                   |
| `triaging`        |   **5** | In-flight intake demos        |
| `draft`           |  **12** | Abandoned / internal drafts   |
| `archived`        |  **20** | Retired noise                 |

### Published subset (462)

| Bucket                                   |   Count |
| ---------------------------------------- | ------: |
| **Open queue** (no disposition)          |  **50** |
| Dispositioned (with non-empty rationale) | **412** |

**Open queue composition**

| Source                                   | Open count |
| ---------------------------------------- | ---------: |
| Anchors (FR-001, 002, 004–007, 009, 010) |      **8** |
| Bulk published, undecided                |     **42** |

### Disposition mix (412 closed published)

| Disposition        |   Count |
| ------------------ | ------: |
| `merge`            |  **85** |
| `monitor`          | **120** |
| `decline`          |  **95** |
| `needs_discussion` | **112** |

Anchors FR-003 (`monitor`) and FR-008 (`decline`) are included in these totals.

### Intake links (north-star support)

| Metric | Target |
| --- | --- |
| Published rows with `intake_linked_request_id` NOT NULL | **≥ 90** (~**20%** of 462 published) |
| Anchor examples | At least **2** bulk rows link to FR-001 or FR-002; at least **1** links to FR-005 |

### Merge graph (schema fields)

| Artifact | Count / rule |
| --- | --- |
| Published rows with `disposition = merge` | **85** (includes merges into anchors) |
| Rows with `merge_target_id` set | **85** (same set) |
| `canonical_request_id` on merged-away rows | Set on **40** bulk victims pointing at canonical published id |
| `feature_request_duplicate_candidate` rows | **≥ 180** total (anchors + bulk); scores ∈ \[0.55, 0.95\] |
| Anchor pair FR-001 ↔ FR-002 | **2** candidate rows (mutual or bidirectional per loader) |
| FR-009 ↔ FR-011 (pending) | **1** candidate on FR-011 at seed |

**Lexical near-dupes not merged:** ≥ **15** published pairs with candidate score ≥ **0.7** and **no** merge disposition (narrative: PM kept separate).

### Duplicate / related narrative (anchors)

```text
FR-001 ←→ FR-002   (anchor pair; open queue)
FR-009 ~  FR-011   (candidate at intake)
FR-006 ⊥  FR-008   (related theme; FR-008 declined with FR-006 reference)
```

### Themes (bulk + anchors)

| `theme_key`             | Min published rows (incl. anchors) |
| ----------------------- | ---------------------------------: |
| `reporting_exports`     |                                 80 |
| `collaboration_sharing` |                                 75 |
| `integrations_alerts`   |                                 60 |
| `permissions_access`    |                                 55 |
| `performance_scale`     |                                 50 |
| `mobile_experience`     |                                 45 |
| `data_governance`       |                                 40 |

Emerging arc: `mobile_experience` and `permissions_access` **volume share** rises in the **last 30 days** of the window (generator rule: ≥ **60%** of those themes’ `submitted_at` after reference − 30d).

### PM triage timestamps

| Rule | Target |
| --- | --- |
| Dispositioned published with `pm_review_started_at` set | **≥ 200** (~**48%** of closed) |
| Remainder | Proxy-eligible (`disposition_at` − `published_at`) per core metrics spec |

### Support personas

Stable keys: `persona-cs-01` … `persona-cs-08`, `persona-ae-01` … `persona-ae-04`, `persona-internal-pm`, plus anchor keys below. Long-tail: no single request **> 35** supporters.

---

## Operational rules

- **No** `seed:fi:simulation` command. **No** `data_origin` column — seed **wipes all FI tables**.
- **Never run `seed:fi` on Vercel production** (or any DB with non-seed data you need). Production deploys: **migrate only**.
- **README** must state wipe-all behavior and the production rule above.

---

## Delivery (Plan / Build)

| Artifact | Location |
| --- | --- |
| Manifest | `packages/fi/seed/manifest.ts` — exports all constants in this section |
| Anchors | `packages/fi/seed/anchors.ts` — FR-001–FR-011 |
| Generator | `packages/fi/seed/generate-seed.ts` |
| Loader | `packages/fi/seed/load.ts` |
| Golden check | `packages/fi/seed/generate-seed.test.ts` — hash of sorted bulk ids |
| CLI | `pnpm seed:fi` |

**Environment:** Reachable Postgres. Seed fails clearly if DB unreachable.

**Not seeded:** embeddings/pgvector. Post-seed: one live `submit_request` for AI triage demo.

**CI:** Full 500-row seed before eve smoke; target **≤ 30s** on CI (`SD-9`). Unit tests use in-memory rows unless testing manifest/generator.

---

## Stable anchor IDs

UUID v4-shaped fixed ids (`00000000-0000-4000-8000-00000000000n`).

| Id      | Short ref |
| ------- | --------- |
| `…0001` | `FR-001`  |
| …       | …         |
| `…000b` | `FR-011`  |

Bulk ids: deterministic from `RNG_SEED` (e.g. namespace `00000000-0000-5000-8xxx-…`).

**FR-012** is retired; do not reference in tests.

---

## Anchor catalog (semantics)

### Theme: `reporting_exports`

| Id | Title | Source | Status | Support | Disposition | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| FR-001 | Export dashboards to CSV | customer | published | 14 | — | Open queue |
| FR-002 | Download CSV of report data | support | published | 6 | — | Open queue; near-duplicate FR-001 |
| FR-003 | Scheduled weekly email reports | prospect | published | 3 | monitor | Rationale references FR-001/002 |
| FR-004 | PDF export for board decks | internal | published | 2 | — | Open queue |

### Theme: `collaboration_sharing`

| Id | Title | Source | Status | Support | Disposition | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| FR-005 | Share dashboards with external clients | customer | published | 11 | — | Open queue |
| FR-006 | Comments on chart widgets | internal | published | 8 | — | Open queue |
| FR-007 | Real-time co-editing on filters | prospect | published | 9 | — | `support_request` smoke |
| FR-008 | @mentions in dashboard notes | support | published | 1 | decline | Rationale mentions FR-006 |

### Theme: `integrations_alerts`

| Id | Title | Source | Status | Support | Disposition | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| FR-009 | Slack alert when KPI drops | support | published | 5 | — | Open queue |
| FR-010 | PagerDuty for critical metrics | customer | published | 4 | — | Open queue |

### Workflow anchor

| Id | Title | Source | Status | Notes |
| --- | --- | --- | --- | --- |
| FR-011 | Mobile push for alerts | internal | pending_confirm | `confirm_request`; pre-baked triage + dup candidate to FR-009 |

**FR-011** fields: problem statement, `theme_key` `integrations_alerts`, decision brief, `triage_completed_at`, duplicate candidate to FR-009 score **0.72**.

### Bulk generator (summary)

- Titles and descriptions: synthetic but product-coherent (dashboard analytics context).
- **Ambiguous** bulk titles: **≥ 10** (vague “make reports better” style).
- **High support / strategic decline:** **≥ 8** published rows with support ≥ **20** and disposition `decline` or `monitor` with explicit strategic rationale.
- `triage_steps`: `{ model: "seed", version: 1, … }` on all published rows.

---

## PM triage queue (UX at 50 open)

Align [journeys](../specs/feature-intelligence-journeys.md) **priority** with implementation:

| Rule | Spec |
| --- | --- |
| `listTriageQueue` sort | **Support count DESC**, then **`published_at` DESC** |
| Web `/triage` | Render **full** queue (50 cards acceptable); show count in page subtitle |
| Eve `list_triage_queue` | Same order as web |

Discover list keeps **most supported** sort separately (unchanged).

---

## Eve / smoke matrix

| Tool | Seed-only pass |
| --- | --- |
| `search_requests` | `collaboration` → includes FR-005–007 |
| `get_request` | `…0008` → decline rationale references FR-006 |
| `list_triage_queue` | Length **50**; first item has highest support among open |
| `support_request` | FR-007 support increment |
| `set_disposition` | Optional FR-010 |
| `get_insights` | `openQueueCount` **50**; `intakeLinkRate` ≈ **0.19–0.21** |
| `confirm_request` | FR-011 → published |
| `submit_request` | Live model only |

---

## Supporter keys

| Key                                    | Used for                    |
| -------------------------------------- | --------------------------- |
| `seed-supporter-a`, `seed-supporter-b` | Anchor support              |
| `eve-test-1`                           | Automated `support_request` |
| `persona-*`                            | Bulk                        |

---

## Non-goals (seed)

- **Intake theme override** / correction rate (no schema column); implied only via PM rationales.
- Committed snapshot JSON of all 500 rows in Git (generator is source of truth).

---

## Acceptance (seed)

| ID | Criterion |
| --- | --- |
| SD-1 | `pnpm seed:fi` idempotent (second run same counts). |
| SD-2 | Manifest counts match within ±0 (exact). |
| SD-3 | `list_triage_queue` length **50**; sort by support verified on top 3 ids. |
| SD-4 | `search_requests` `CSV` → FR-001, FR-002. |
| SD-5 | README: wipe-all + **never seed production**. |
| SD-6 | `getInsights()` without range: `publishedCount` = **462**; `intakeLinkCount` ≥ **90**. |
| SD-7 | Same `RNG_SEED` → identical bulk ids and titles. |
| SD-8 | `GENERATED_BULK_ID_HASH` in tests matches committed constant in manifest. |
| SD-9 | Seed completes in **≤ 30s** on CI (document if exceeded). |

---

## Approval

Assessment 12-row seed superseded **2026-10-25**. **Implemented** — [demo depth tasks](../tasks/feature-intelligence-demo-depth.md) complete.
