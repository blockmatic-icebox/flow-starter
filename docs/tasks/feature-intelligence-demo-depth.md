# Tasks: Feature Intelligence — demo depth (500 seed + analytics)

**Last reviewed:** 2026-10-25  
**Status:** Complete

**Role:** Execution checklist only — requirements live in specs.  
**Specs:** [seed v2](../specs/feature-intelligence-seed.md) · [analytics v2](../specs/feature-intelligence-analytics.md)  
**Initiative:** [feature-intelligence.md](../initiatives/feature-intelligence.md) § Demo depth

**Seed CLI:** `pnpm seed:fi` = `pnpm --filter @repo/fi seed` (500 rows; wipes FI tables).

---

## Gates

| Gate     | Status |
| -------- | ------ |
| **G-D1** | Done   |
| **G-D2** | Done   |
| **G-D3** | Done   |
| **G-D4** | Done   |
| **G-D5** | Done   |
| **G-D6** | Done   |

---

## Wave 1 — Manifest and generator

- [x] **T-D1-1** — `manifest.ts`
- [x] **T-D1-2** — `anchors.ts`
- [x] **T-D1-3** — `generate-seed.ts` + `generate-bulk-published.ts`
- [x] **T-D1-4** — Merge targets + duplicate candidates
- [x] **T-D1-5** — Intake links
- [x] **T-D1-6** — `load.ts`
- [x] **T-D1-7** — `generate-seed.test.ts` + `manifest.test.ts`

---

## Wave 2 — Eval, smoke, and package tests

- [x] **T-D2-1** — `fixture.test.ts` open queue 50
- [x] **T-D2-2** — `manifest.test.ts`
- [x] **T-D2-3** — smoke list-triage-queue 50
- [x] **T-D2-4** — get-dispositioned anchor
- [x] **T-D2-5** — testing spec note
- [x] **T-D2-6** — README seed warnings

---

## Wave 3 — PM triage queue at scale

- [x] **T-D3-1** — `listTriageQueue` support sort
- [x] **T-D3-2** — Covered by smoke + manual pass (`pnpm build:web`)
- [x] **T-D3-3** — Triage subtitle
- [x] **T-D3-4** — Build verification; browser pass recommended on `/triage`

---

## Wave 4 — Metrics API

- [x] **T-D4-1** — `bucketing.ts`
- [x] **T-D4-2** — `getInsights({ range? })`
- [x] **T-D4-3** — `compute-insights-scoped.ts` + tests
- [x] **T-D4-4** — `compute-trends.ts`
- [x] **T-D4-5** — `bucketing.test.ts`, `insights-range.test.ts`

---

## Wave 5 — Insights UI

- [x] **T-D5-1** — Range control (default 90d)
- [x] **T-D5-2** — PM triage card + proxy footnote
- [x] **T-D5-3** — Weekly bar panels
- [x] **T-D5-4** — Themes + judgment table
- [x] **T-D5-5** — Subtitle copy
- [x] **T-D5-6** — `pnpm build:web` + `/insights` dynamic route

---

## Wave 6 — Contracts and QA

- [x] **T-D6-1** — `ARCHITECTURE.md`
- [x] **T-D6-2** — `DESIGN.md`
- [x] **T-D6-3** — `PRODUCT.md` + spec cross-links
- [x] **T-D6-4** — `pnpm qa` + `pnpm exec eve eval smoke`
