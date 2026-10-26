# Spec: Feature Intelligence — testing (MVP)

**Last reviewed:** 2026-10-25  
**Status:** Current  
**Initiative:** [feature-intelligence.md](../initiatives/feature-intelligence.md)

## Build order (TDD)

Aligns with [initiative MVP waves](../initiatives/feature-intelligence.md#mvp-cut-line-assessment).

1. **DB migration + seed** — `pnpm db:migrate` then `pnpm seed:fi`.
2. **`@repo/fi` unit tests** — metrics, theme T1, lexical retrieve, full harness, CRUD actions.
3. **Agent tools** — thin wrappers; `agent/instructions.md` (AI UX); `pnpm --filter @repo/fi test` + `eve dev`.
4. **`evals/smoke`** — after core tools (incl. AG-7).
5. **Web UI** — manual W-* checklist last (no FI Playwright).

Red → green on `@repo/fi` before adding UI server actions. Task ids and gates: [docs/tasks/feature-intelligence.md](../tasks/feature-intelligence.md).

## Strategy

| Layer | MVP approach | Rationale |
| --- | --- | --- |
| **`@repo/fi` triage harness** | **Required:** offline `triage-matrix` + unit tests (no API key); optional live decide test | Same harness for web + eve; see [triage harness spec](./feature-intelligence-triage-harness.md) |
| **eve (`agent/`)** | **`eve eval`** smoke evals + [seed](./feature-intelligence-seed.md) fixture | Exercises real HTTP surface and tools; catches prompt/tool regressions |
| **Web UI (`apps/web`)** | **Manual only** — no new Playwright specs for FI routes | Time box; validate in browser; demo video is external recorder (not in-app) |
| **Ask-only `/chat`** | Manual smoke | No automation in MVP |

Factory browser automation ([verification.md](../../.agents/flow/operations/verification.md)) applies when **you** run a manual pass before demo; it does not add CI Playwright coverage for FI in this slice.

---

## Web UI — manual checklist

Run after `pnpm dev`, `pnpm --filter @repo/fi seed`, and env for AI triage.

| # | Flow | Pass |
| --- | --- | --- |
| W-1 | Home → Requests list shows seeded themes/sources |  |
| W-2e | External context submit → simplified confirm → thank-you (no brief/transparency) |  |
| W-2i | Internal context submit → duplicates prominent → link on confirm |  |
| W-3 | Near-duplicate live submit surfaces FR-001/002 candidates |  |
| W-4 | Support increments on detail |  |
| W-5 | Triage queue shows **50** seeded items (sorted by support); **inline panel** expand → disposition + rationale (no dialog-first) |  |
| W-5a | Triage badge on nav matches `openQueueCount`; empty queue uses `Empty` + Insights link |  |
| W-6 | Detail transparency panel renders steps |  |
| W-7 | Insights shows six metric cards, range **90d**, weekly panels, themes; `openQueueCount` **50** after seed; **capture rate** moves after W-5 dispositions |  |
| W-8 | `/chat` answers product questions; **does not** mutate requests; empty state has **prompt starters** |  |
| W-9 | Submit loading shows harness **stage label** + ~10–20s estimate (`aria-live`) |  |

**Playwright:** Keep existing [`apps/web/tests/browser/smoke.spec.ts`](../../apps/web/tests/browser/smoke.spec.ts) only. **Do not add** `tests/browser/feature-intelligence*.spec.ts` until post-MVP. Update the smoke test minimally if the homepage copy changes.

**CI:** `pnpm test:browser` remains starter-level; FI coverage is not a merge gate for this initiative.

### Remediation manual (W-R)

After [remediation Build](../tasks/feature-intelligence-remediation.md):

| # | Flow | Pass |
| --- | --- | --- |
| W-R1 | Merge in triage requires target; save updates target support count |  |
| W-R2 | Submit with AI degraded/failed → Submit anyway publishes; Retry re-runs harness |  |
| W-R3 | Detail Decision sidebar shows rationale, time, actor, merge link |  |
| W-R4 | Empty disposition rationale blocked |  |
| W-R5 | Discover search + sort + page 2 at 500 rows; support on cards |  |
| W-R6 | Triage sort control; insights seed footnote when applicable |  |

**Eval policy:** No smoke eval that only greps `agent/` source; assert `t.succeeded()` and persisted fields ([RC-9](./feature-intelligence-remediation.md#rc-9--verification-eve-and-domain)).

---

## eve — eval layout (Build)

```text
evals/
├── evals.config.ts      # setup: migrate + seed; teardown optional
├── smoke/
│   ├── list-triage-queue.eval.ts
│   ├── search-csv.eval.ts
│   └── get-dispositioned.eval.ts
└── live/                  # optional; requires model — skip in CI default
    └── submit-near-duplicate.eval.ts
```

### `evals.config.ts`

- **`setup`:** Ensure `DATABASE_URL`, run migrations if needed, `pnpm --filter @repo/fi seed`.
- **`teardown`:** Optional truncate FI tables or leave seed for local dev.
- **No Braintrust** in assessment unless already configured; local `eve eval` artifacts only.

### Deterministic smoke evals (gate in CI when wired)

Use natural-language prompts that should invoke tools; assert with `t.calledTool` + `t.succeeded()`.

| Eval id | User message (example) | Gates |
| --- | --- | --- |
| `smoke/list-triage-queue` | “What’s on the PM triage queue?” | `list_triage_queue`; count **50** |
| `smoke/search-csv` | “Find requests about CSV export” | `search_requests`; mentions FR-001 or FR-002 |
| `smoke/get-dispositioned` | “Why was FR-008 declined?” | `get_request`; includes decline rationale theme |
| `smoke/submit-no-auto-confirm` | “Submit: Export to PDF” (after seed) | `submit_request` only; **no** `confirm_request` until follow-up “confirm” (AG-7) |
| `smoke/confirm-after-approval` | Explicit confirm after draft | `@repo/fi` `createDraftAndTriage` → `confirmRequest`; **owned** row |
| `smoke/set-disposition-monitor` | Monitor disposition on owned signal | Owned draft → confirm → `setDisposition` monitor (does not mutate seed queue) |
| `smoke/merge-disposition` | Merge into canonical target | Owned published pair → `setDisposition` merge + `mergeTargetId` |

**Eval DB:** `evals/evals.config.ts` migrates then runs `FI_SEED_IF_EMPTY=1 pnpm seed:fi` (skip reload when `feature_request` already has rows). Prefer `EVE_EVAL_DATABASE_URL` for an isolated branch ([remediation](./feature-intelligence-remediation.md#rc-9--verification-eve-and-domain)).

**Model:** Use real model for evals that need tool routing, or a **fixture agent** with `mockModel` only for plumbing tests (see [eve evals docs](https://eve.dev/docs/evals.md)). Assessment minimum: **one real-model smoke** locally before demo recording; CI can run deterministic checks on `@repo/fi` if eval flakiness is a concern (document in Plan).

### Live evals (manual / pre-demo)

| Eval | Purpose |
| --- | --- |
| `live/submit-near-duplicate` | `submit_request` after seed; assert duplicate candidates in tool result or follow-up turn |

Run: `npx eve eval smoke` (local server). Target deployed URL with `eve eval --url …` for rehearsal.

### Agent Runs

After deploy, use Vercel Agent Runs trace for one eval failure or successful tool chain in an optional demo “architecture” segment (external recording).

---

## Commands (reference)

```bash
# Domain seed (required before eve eval; 500 rows — never on production DB)
pnpm --filter @repo/fi seed   # open triage queue: 50 after seed

# Eve smoke (after eve init + agent implemented)
npx eve eval smoke

# Web manual
pnpm dev
# follow W-1–W-8

# Repo QA (still run; not FI browser coverage)
pnpm qa
```

---

## Acceptance

| ID | Criterion |
| --- | --- |
| VT-1 | Testing spec linked from initiative and eve spec. |
| VT-2 | No FI Playwright specs added under `apps/web/tests/browser/`. |
| VT-3 | At least **two** `evals/smoke/*.eval.ts` implemented before calling eve v1 done. |
| VT-5 | `pnpm --filter @repo/fi test` passes harness fixtures (TH-4) and **metrics unit tests** for `getInsights` formulas. |
| VT-4 | Manual checklist W-1–W-8 executed once before submission recording. |
