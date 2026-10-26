# Tasks — Hunch hardening (phase 2)

Follow-up to [hunch-redesign.md](hunch-redesign.md). Initiative: [hunch-redesign.md](../initiatives/hunch-redesign.md).

**Goal:** Close retrospective gaps—trustworthy data on Pulse, mockup-faithful Review/Add feedback, testable GenUI, shared evidence UI, tier-3 Ask fallback, and verified desktop/mobile states.

**Branch:** `meta-cto` (assessment).

---

## Wave A — Correctness and tests (foundation)

- [x] **A-1** `listRecentDecisions` + Pulse table
- [x] **A-2** `compose-fi.test.ts` scenario coverage
- [x] **A-3** `genui-compose.route.test.ts` invalid body 400
- [x] **A-4** `compose-fi-routes.ts` exported matchers

**Gate A:** web + fi tests pass

---

## Wave B — Shared GenUI + product components

- [x] **B-1** `EvidenceQuote`, `RankedSignalList` in `@repo/genui`
- [x] **B-2** Views aligned with Hunch tokens (primary borders/links)
- [x] **B-3** `compose-fi` uses new components for prioritize / evidence
- [x] **B-4** [hunch-genui.md](../specs/hunch-genui.md) updated

---

## Wave C — Tier-3 Ask fallback

- [x] **C-1** `synthesizeOpenEndedAnswer` on search-fallback when gateway set
- [x] **C-2** Grid fallback when gateway absent
- [x] **C-3** `.env.example` + spec env notes

---

## Wave D — Review and Add feedback

- [x] **D-1** Review split layout + `focus` query
- [x] **D-2** Hunch suggestion vs Record decision labels
- [x] **D-3** Feedback stepper + sidebar
- [x] **D-4** DESIGN unchanged (layout documented in spec)

---

## Wave E — Route and contract cleanup

- [x] **E-1** Legacy `requests/*` → redirects; sitemap canonical routes
- [x] **E-2** starter contract + insights dashboard links
- [x] **E-3** GLOSSARY hunch + PRODUCT note

---

## Wave F — GenUI actions

- [x] **F-1** `/review` link via `RankedSignalList.reviewHref` (plain anchors)
- [x] **F-2** No model-supplied action callbacks

---

## Wave G — Verification

- [x] **G-1** Documented in [20261026-hunch-hardening-verification.md](../research/20261026-hunch-hardening-verification.md)
- [x] **G-2** States noted for manual pass
- [x] **G-3** Research log added

---

## Reference parity

- [x] Timeboxed: caps optional per inventory (documented in verification log)
