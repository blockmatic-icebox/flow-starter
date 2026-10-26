# Tasks — Hunch PM Overview (phase 3)

Initiative: [hunch-redesign.md](../initiatives/hunch-redesign.md) · Spec: [hunch-pm-overview.md](../specs/hunch-pm-overview.md)

**Branch:** `meta-cto` · Shipped; see [verification log](../research/20261026-hunch-pm-overview-verification.md).

## Wave 1 — Domain

- [x] `decisionsInRangeCount`, `readinessDegradedN` in scoped insights + tests
- [x] `isTriageDegraded` helper
- [x] `listAttentionItems` + tests
- [x] Export from `@repo/fi`

## Wave 2 — Language

- [x] `hunch-content` nav + subtitles
- [x] Shell, pages, breadcrumbs, compose-fi terminology

## Wave 3 — Overview UI

- [x] Sections A–D on `/`
- [x] Shared metric cards

## Wave 4 — Triage flow

- [x] Evidence, duplicates, degraded banner
- [x] Save → revalidate → next focus
- [x] `?resume=` on Add feedback

## Wave 5 — Dev

- [x] `/dev` page + redirect `/developers`
- [x] Collapsible Dev nav; queue badge unavailable state

## Wave 6 — Verify

- [x] `pnpm --filter @repo/fi test`, `pnpm --filter web test`, types
- [x] Eve smoke eval (`insights-decisions-in-range`)
- [x] agent-browser walkthrough — [20261026-hunch-pm-overview-verification.md](../research/20261026-hunch-pm-overview-verification.md)
- [x] PRODUCT, DESIGN, ARCHITECTURE, hunch-genui updates

**Gate:** Automated checks pass; browser pass documented in Task report.
