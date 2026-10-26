# Spec: Feature Intelligence — workflow remediation

**Last reviewed:** 2026-10-25  
**Status:** Current  
**Initiative:** [feature-intelligence.md](../initiatives/feature-intelligence.md)  
**Research:** [20261025-fi-adversarial-review.md](../research/20261025-fi-adversarial-review.md)  
**Architecture:** [ADR 0004](../adr/0004-fi-workflow-integrity-and-safety.md)

## Problem

Contracts and demo depth describe a **complete** PM workflow (merge, discovery, validation, AI recovery, audit). Implementation partially matches—creating evaluator risk and spec drift.

## Outcome

Restore **fidelity** between [core spec](./feature-intelligence.md) and runtime behavior: PMs cannot save invalid dispositions; submitters are never blocked by model failure; stakeholders see decisions; discovery works at 500-row scale; Eve evals assert **persisted outcomes**.

## Non-goals

- Authentication, RBAC, Playwright FI suites, pgvector, new MCP server product surface, prioritization rubric editor.

---

## RC-1 — Merge and supporter rollup

**Domain (`setDisposition`):**

- `disposition = merge` requires `mergeTargetId` ≠ self, target **published**, target not already merged into another row.
- On success: set source `merge_target_id`, `canonical_request_id` (or equivalent linking fields per schema), disposition + rationale + `disposition_at`.
- **Rollup:** Re-attribute `feature_request_support` rows from source → target (dedupe by supporter key); recompute target support count; mark source **archived** (or status that excludes from discover queue) with navigable link to target.
- Reject invalid lifecycle (e.g. disposition on non-published).

**Web:** Triage inline panel — when Merge selected, show **searchable select** of published requests (exclude current id); disable Save until target + non-empty rationale.

**Eve:** `set_disposition` tool receives same validation errors as web.

**Tests:** `@repo/fi` integration tests for merge happy path, missing target, self-merge, rollup counts; Eve eval dispositions merge with asserted DB state.

---

## RC-2 — AI failure recovery (submitter)

**Domain:**

- Triage failure (gateway timeout, malformed object, missing key with no degraded artifact) still allows transition to **PendingConfirm** with: preserved title/description; editable problem statement defaulting from description; `triage_steps` records failure reason (internal detail) and `quality: degraded | failed`.
- Optional flag `needs_ai_review` (column or triage_steps) visible to PM queue filter/badge.

**Web (`/requests/new`):**

- Nontechnical banner when degraded/failed.
- Actions: **Submit anyway** (confirm/publish path), **Retry AI review** (re-run harness on draft).
- Never show fake “success” analysis; partial fields labeled honestly.

**Tests:** Harness unit test for failure paths; web covered by manual W-R2; Eve eval optional recovery path when feasible without flaky live model.

---

## RC-3 — Decision transparency

**Domain:**

- Persist disposition actor as **simulated PM** constant or configurable display name (no auth).
- Append or store **disposition event** sufficient for audit: disposition, rationale, `disposition_at`, actor label, `merge_target_id` when merge.

**Web (`/requests/[id]`):**

- Sidebar **Decision** section: outcome badge, rationale, timestamp, actor; merge link to target when applicable.
- Existing “How this was evaluated” remains for intake triage steps.

**Leader:** Same read-only detail; insights unchanged except honest copy where noted in RC-6.

---

## RC-4 — Domain validation

**`setDisposition` and related actions:**

- Non-empty trimmed `disposition_rationale` (min length 1).
- Valid disposition enum; merge rules from RC-1.
- Idempotent or no-op rules documented for double-submit.

**Eve tool schema:** Align Zod with domain (no weaker validation in tools).

**Tests:** Unit tests for each rejection case; negative tests via server action or direct domain call.

---

## RC-5 — Discovery

**Domain (`searchRequests` or successor):**

- Query params: `q` (title/problem ilike), `themeKey`, `sort` (`support` | `published_at` | `title`), `page`, `pageSize` (default 25, max 100).
- Return `{ items, total, page, pageSize }` with **supportCount** per item.

**Web (`/requests`):**

- Search input (debounced or submit), sort control, pagination controls, theme chips retained.
- Cards show support count, disposition badge when set.

**Tests:** `@repo/fi` search pagination/sort tests.

**Manual:** W-R5 — search “CSV”, sort by support, page 2 returns different rows.

---

## RC-6 — Prioritization and analytics honesty

**Queue:** `listTriageQueue` accepts `sort` — at minimum **support** (default), **newest published**, **oldest in queue** (published_at asc). UI sort dropdown on `/triage`.

**Insights / seed:**

- Document in UI footnote when trends include **seed-synthetic** timestamps (`SEED_REFERENCE_ISO`).
- Do not change open-queue capture-rate formula without initiative approval; ensure disposition events use real `disposition_at` on live PM actions.

---

## RC-7 — Duplicate intelligence (honesty)

- Keep lexical retrieve; UI labels **“Similar wording (lexical)”** unless confidence tier is documented in harness.
- Near-duplicate AC-2 remains best-effort; no embedding requirement.

---

## RC-8 — Database seed safety

- `seed/load.ts` refuses to run when `NODE_ENV=production` **or** `FI_SEED_ALLOW_DESTRUCTIVE=1` not set **or** optional hostname allowlist mismatch (document env in seed spec).
- `evals.config.ts` uses dedicated DB URL when `EVE_EVAL_DATABASE_URL` set; document in testing spec.
- README and assessment section: **never seed production**.

---

## RC-9 — Verification (Eve and domain)

**Replace or demote** static source-grep smoke tests.

**Minimum Eve smoke additions (behavioral):**

- List triage queue → tool called + count plausible.
- Set disposition monitor → `get_request` shows disposition + rationale.
- Set disposition merge (with target) → supporter count on target increases per rollup rules.
- Submit/confirm path does not auto-publish without confirm (behavioral, not grep).

**CI:** `pnpm exec eve eval smoke` after migrate + seed on isolated DB.

**MCP note:** Integration surface = **Eve HTTP + tools** and **Next server actions**; no new FI MCP unless separately authorized.

---

## RC-10 — Contract honesty

- [PRODUCT.md](../../PRODUCT.md) implementation table lists **remediation** items as **Partial** until RC satisfied.
- Core spec edge cases remain normative; this doc tracks **gap closure** only.

---

## Acceptance criteria (remediation)

| ID | Criterion |
| --- | --- |
| RC-1 | PM cannot save merge without target; rollup updates target support; source links to target |
| RC-2 | Simulated gateway failure still allows publish via Submit anyway; retry re-enters harness |
| RC-3 | Detail shows decision block with rationale, time, actor, merge link |
| RC-4 | Empty rationale rejected server-side |
| RC-5 | Discover search + sort + pagination at 500 rows; support on cards |
| RC-6 | Triage sort control; insights footnote for seed-synthetic trends |
| RC-7 | Duplicate UI uses honest lexical labeling |
| RC-8 | Seed aborts on production without explicit allow flag |
| RC-9 | Eve smoke asserts DB/tool outcomes; no grep-only gates |
| RC-10 | PRODUCT reflects partial vs complete accurately |

---

## Verification

| Layer | Method |
| --- | --- |
| `@repo/fi` | Unit + integration tests per RC |
| Eve | `eve eval smoke` behavioral cases |
| Web | Manual W-R* checklist in [testing spec](./feature-intelligence-testing.md) (Specify adds rows) |
| Review | Adversarial pass against this doc before Ship |

---

## Approval

**Accepted** with initiative update 2026-10-25. **Plan:** [docs/tasks/feature-intelligence-remediation.md](../tasks/feature-intelligence-remediation.md) (gates G-R1–G-R5). **Build** requires explicit human authorization.
