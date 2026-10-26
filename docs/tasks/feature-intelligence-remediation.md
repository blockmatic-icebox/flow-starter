# Tasks: Feature Intelligence — workflow remediation

**Last reviewed:** 2026-10-25  
**Status:** Complete (Build 2026-10-26)  
**Spec:** [feature-intelligence-remediation.md](../specs/feature-intelligence-remediation.md) (RC-1–RC-10)  
**ADR:** [0004](../adr/0004-fi-workflow-integrity-and-safety.md)  
**Initiative:** [feature-intelligence.md](../initiatives/feature-intelligence.md)

**Role:** Execution checklist for dev — requirements live in the remediation spec only.  
**Rules:** Do not start a task until **Depends on** is satisfied. Reference ids in commits (`fix(fi): T-R-2 merge rollup`).  
**Seed:** `pnpm seed:fi` — after **T-R-8**, destructive seed requires `FI_SEED_ALLOW_DESTRUCTIVE=1` off production.

---

## Gates

| Gate | Requires | Unblocks |
| --- | --- | --- |
| **G-R1** | **T-R-8** (seed guard) | Safe local/eval re-seed during remediation |
| **G-R2** | **T-R-1** (disposition validation) | Merge, Eve disposition errors, web save |
| **G-R3** | **T-R-2**, **T-R-3**, **T-R-4**, **T-R-6** (domain RC core) | Wave B web (except parallel-safe items) |
| **G-R4** | **T-R-10**–**T-R-14** (web) + **T-R-21** | Behavioral Eve evals (**T-R-20**) |
| **G-R5** | **T-R-30**, **T-R-31**, **T-R-32** | Review / Ship |

**Critical path (serial):** T-R-8 → T-R-1 → T-R-2 → T-R-10 → T-R-20 → T-R-30 → T-R-32

**Parallel after G-R2:**

- **T-R-3** (discovery API) ∥ **T-R-4** (AI failure domain) ∥ **T-R-6** (queue sort) — none block each other; all need **T-R-1** only where noted below.
- **T-R-13** needs **T-R-3** only.
- **T-R-11** needs **T-R-4** only.
- **T-R-12** needs **T-R-2** (merge fields for audit).
- **T-R-14** needs **T-R-6** for triage sort; RC-7 copy can start after **T-R-1**.

---

## Dependency matrix

| Task | Depends on | RC | Primary write set |
| --- | --- | --- | --- |
| T-R-8 | — | RC-8 | `packages/fi/seed/load.ts`, seed spec, `evals/evals.config.ts`, README |
| T-R-1 | T-R-8 (recommended) | RC-4 | `packages/fi/src/queue/set-disposition.ts`, tests, `agent/tools/set-disposition` if schema |
| T-R-2 | T-R-1 | RC-1 | `set-disposition.ts`, support rollup, schema/status if needed, integration tests |
| T-R-3 | — | RC-5 | `packages/fi/src/requests/search-requests.ts`, tests, `packages/fi/src/index.ts` exports |
| T-R-4 | — | RC-2 | `packages/fi/src/triage/*`, confirm/create paths, tests |
| T-R-6 | — | RC-6 | `packages/fi/src/queue/list-triage-queue.ts`, tests |
| T-R-10 | T-R-2, G-R2 | RC-1 | `apps/web/app/(fi)/triage/*`, server actions |
| T-R-11 | T-R-4 | RC-2 | `apps/web/app/(fi)/requests/new/*`, actions |
| T-R-12 | T-R-2 | RC-3 | `apps/web/app/(fi)/requests/[id]/*`, domain actor field if new |
| T-R-13 | T-R-3 | RC-5 | `apps/web/app/(fi)/requests/page.tsx`, search action |
| T-R-14 | T-R-6 | RC-6, RC-7 | triage page, submit duplicate labels, `insights` footnote |
| T-R-21 | T-R-1 | RC-4 | `agent/tools/set-disposition.ts` |
| T-R-20 | T-R-2, T-R-21, T-R-10 | RC-9 | `evals/smoke/*`, remove grep-only gates |
| T-R-30 | G-R4 | — | CI commands only |
| T-R-31 | T-R-30 | — | `docs/research/20261025-fi-browser-verification.md` |
| T-R-32 | T-R-31 | RC-10 | `PRODUCT.md`, initiative progress, research adversarial re-pass |

---

## Wave 0 — Safety (first)

- [x] **T-R-8** — Seed + eval DB safety (**RC-8**)
  - **Depends on:** —
  - **Do:** Refuse `seed/load.ts` when `NODE_ENV=production` unless `FI_SEED_ALLOW_DESTRUCTIVE=1`; log clear error. Document `EVE_EVAL_DATABASE_URL` in `evals/evals.config.ts` (prefer when set). Update seed + testing specs.
  - **Verify:** Unit or script test that production without flag throws; `pnpm seed:fi` still works locally with flag unset in dev.

---

## Wave A — Domain (`@repo/fi`)

- [x] **T-R-1** — Disposition validation gate (**RC-4**)
  - **Depends on:** T-R-8 (recommended)
  - **Do:** Non-empty trimmed rationale; valid disposition enum; reject disposition on non-`published`; merge prechecks (target required, not self) before rollup logic. Single function used by web + eve.
  - **Verify:** `pnpm --filter @repo/fi test` — new cases for empty rationale, invalid status, merge without target.

- [x] **T-R-2** — Merge + supporter rollup (**RC-1**)
  - **Depends on:** T-R-1
  - **Do:** On merge: link source → target, archive/hide source from discover, re-attribute `feature_request_support` (dedupe supporter keys), recompute counts. Set `disposition_at`, simulated actor constant.
  - **Verify:** Integration test — two requests, supports on A, merge A→B, B count increases, A archived with link.

- [x] **T-R-3** — Discovery query API (**RC-5**)
  - **Depends on:** — (∥ Wave A after G-R1 optional)
  - **Do:** `searchRequests({ q, themeKey, sort, page, pageSize })` → `{ items, total, page, pageSize }` with `supportCount`; default pageSize 25, max 100; sorts `support` \| `published_at` \| `title`.
  - **Verify:** Tests for pagination boundaries, sort order, `q` filter on 500 seed.

- [x] **T-R-4** — AI failure / degraded confirm (**RC-2**)
  - **Depends on:** —
  - **Do:** Failed/degraded harness still reaches confirm; `triage_steps` records failure honestly; `needs_ai_review` (column or JSON) for PM queue; publish path does not require successful synthesis.
  - **Verify:** Unit test with mocked synthesis failure; confirm still allowed.

- [x] **T-R-6** — Triage queue sort (**RC-6**)
  - **Depends on:** —
  - **Do:** `listTriageQueue({ sort })` — `support` (default), `newest`, `oldest` (published_at asc).
  - **Verify:** `list-triage-queue.test.ts` sort variants.

---

## Wave B — Web (`apps/web`)

- [x] **T-R-10** — Merge target picker (**RC-1**)
  - **Depends on:** T-R-2, **G-R2**
  - **Do:** When disposition = merge, searchable/select published targets (exclude current); disable save until target + rationale.
  - **Verify:** Manual W-R1; disposition action passes `mergeTargetId`.

- [x] **T-R-11** — Submit AI failure UX (**RC-2**)
  - **Depends on:** T-R-4
  - **Do:** Banner, partial fields labeled, **Submit anyway**, **Retry AI review**; no fake success.
  - **Verify:** Manual W-R2 (simulate missing key or forced failure hook if available).

- [x] **T-R-12** — Decision sidebar (**RC-3**)
  - **Depends on:** T-R-2
  - **Do:** Outcome badge, rationale, timestamp, simulated PM, merge link to target.
  - **Verify:** Manual W-R3 after triage disposition.

- [x] **T-R-13** — Discover UI (**RC-5**)
  - **Depends on:** T-R-3
  - **Do:** Search, sort control, pagination, theme chips; support count on cards.
  - **Verify:** Manual W-R5.

- [x] **T-R-14** — Polish: triage sort, lexical labels, insights footnote (**RC-6**, **RC-7**)
  - **Depends on:** T-R-6
  - **Do:** Sort dropdown on `/triage`; duplicate UI “Similar wording (lexical)”; insights footnote for seed-synthetic trends.
  - **Verify:** Manual W-R6.

---

## Wave C — Eve + evals

- [x] **T-R-21** — Tool parity with domain (**RC-4**)
  - **Depends on:** T-R-1
  - **Do:** `set_disposition` Zod + errors match `setDisposition` rejections.
  - **Verify:** Tool test or eval catches invalid merge.

- [x] **T-R-20** — Behavioral smoke evals (**RC-9**)
  - **Depends on:** T-R-2, T-R-21, T-R-10 (merge path exists end-to-end)
  - **Do:** Remove/replace grep-only `submit-no-auto-confirm` pattern; assert `t.succeeded()` + DB fields for disposition and merge rollup.
  - **Verify:** `pnpm exec eve eval smoke` exit 0 after migrate + seed.

---

## Wave D — Integration verify + contracts

- [x] **T-R-30** — Automated regression bundle
  - **Depends on:** **G-R4**
  - **Do:** Run `pnpm --filter @repo/fi test`, `pnpm exec eve eval smoke`, `pnpm qa`, `pnpm build:web` (or project standard).
  - **Verify:** Record exit codes in task report / research log.

- [x] **T-R-31** — Manual W-R pass
  - **Depends on:** T-R-30
  - **Do:** W-R1–W-R6 per [testing spec](../specs/feature-intelligence-testing.md#remediation-manual-w-r); update browser research doc.
  - **Verify:** Checklist filled with date and environment (local/Vercel).

- [x] **T-R-32** — Contract honesty + adversarial re-pass (**RC-10**)
  - **Depends on:** T-R-31
  - **Do:** Update `PRODUCT.md` implementation table to **Live** where RC met; initiative stage → Review; short pass/fail table in research doc.
  - **Verify:** Each RC-1–RC-10 has evidence link (test, eval, or manual id).

---

## Worker delegation map (optional parallel)

| Worker            | Tasks                  | Must not touch                  |
| ----------------- | ---------------------- | ------------------------------- |
| Domain A          | T-R-1, T-R-2           | `apps/web`                      |
| Domain B          | T-R-3, T-R-4, T-R-6    | `apps/web` (coordinate exports) |
| Safety            | T-R-8                  | —                               |
| Web discover      | T-R-13                 | after T-R-3 merged              |
| Web triage/detail | T-R-10, T-R-12, T-R-14 | after T-R-2 / T-R-6             |
| Web submit        | T-R-11                 | after T-R-4                     |
| Agent             | T-R-21, T-R-20         | after domain gates              |

Integrator: merge order **Wave 0 → A → B → C → D**; run **T-R-30** once.

---

## Acceptance

All **[RC-1–RC-10](../specs/feature-intelligence-remediation.md#acceptance-criteria-remediation)** in the remediation spec. **G-R5** = remediation shippable for Review.
