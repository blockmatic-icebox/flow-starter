# Glossary — Meta CTO product language

**Bounded context:** **Feature Intelligence** — turning unstructured feature feedback into recorded product decisions.

This document is the **ubiquitous language** for product code (`@repo/fi`, `apps/web`, `agent/`). Factory methodology terms live in [.agents/flow/glossary.md](.agents/flow/glossary.md), not here.

When a term appears in specs, UI, tools, or ADRs, use these definitions. Prefer **nouns** from this list over synonyms (e.g. **disposition**, not “status update” or “resolution”).

**UI copy:** External submitters see plain language (“feedback”, “similar ideas”); PM/leader surfaces use glossary terms. See [journeys](docs/specs/feature-intelligence-journeys.md#cross-persona-boundaries).

---

## Core aggregate

### Feature request

The central **aggregate** for customer and internal feedback about what to build. Identified by `id` (stable UUID in seeds and APIs).

**Composes:** raw submitter text, AI triage artifacts, optional links to other requests, support signals, and PM **disposition**.

**Invariants:**

- A **published** request has `published_at` and a non-empty **problem statement** after confirm.
- **Disposition** is set only by PM workflow (human or eve tool acting as PM in demo)—never by the triage harness alone.
- **Theme** is stored as `theme_key` from the closed **theme registry**; display uses `theme_label`.

**Not:** a Jira ticket, a chat message, or a roadmap commitment.

---

## Submitter-facing language

### Raw submission

`title` + `description` + **source** as entered before triage. May be solution-shaped or duplicate-heavy.

### Source

Who raised the feedback: `customer`, `prospect`, `support`, or `internal`. Metadata for prioritization and reporting—not authentication.

### Support

Expression of interest in an existing **published** request (cookie-scoped **supporter key** in MVP). Increases visibility; does not equal roadmap approval.

---

## Triage and intelligence

### Triage

Automated processing of a **raw submission** before or during publish. Implemented by the **triage harness** in `@repo/fi`.

### Triage harness

Host-owned pipeline: lexical **retrieve** → theme **classification** (deterministic T1 and/or Jev T2) → **synthesis** (structured prose) → persisted **triage steps**. Shared by web submit and eve `submit_request`.

**Not:** the eve **operator** agent itself; the harness is a domain service the agent invokes.

### Decision-ready

State where a PM can act without rewriting raw text: **problem statement**, **theme**, **decision brief**, and duplicate context exist (`triage_completed_at` set). May still await submitter **confirm** (`pending_confirm`) or PM **disposition**.

### Problem statement

The underlying **need**, not the requested feature wording. Editable at confirm; canonical product intent for discovery and triage queue.

### Theme registry

Closed set of `theme_key` values in `packages/fi/src/theme/registry.ts`: `reporting_exports`, `collaboration_sharing`, `integrations_alerts`, `permissions_access`, `performance_scale`, `mobile_experience`, `data_governance`, `platform_other`. Triage classification maps here; filters and analytics use **keys**.

### Duplicate candidate

A published request surfaced by retrieve as potentially the same need, with `score` and `explanation`. Candidates inform UI and **intake link**; they do not auto-merge.

### Triage steps (transparency)

Append-only audit JSON on the request describing how triage ran (retrieve, classify, models, `duration_ms`). Shown in **transparency** UI—not a separate aggregate.

---

## Linking (two mechanisms)

### Intake link

Submitter accepts relationship to an existing request at **confirm** (`intake_linked_request_id`). Drives **intake link rate**; does not remove the new row in MVP.

### PM merge (disposition)

PM **disposition** `merge` with `merge_target_id` (and optional `canonical_request_id`). Records a product decision; separate from intake link.

---

## PM decision language

### PM triage queue

Published requests with **no disposition**, ordered for review (support, then recency). Hero workflow for assessment demo.

### Disposition

Recorded PM decision: `merge`, `monitor`, `decline`, or `needs_discussion`. Requires **disposition rationale**; sets `disposition_at`.

### Decision brief

One paragraph for PMs: what the need is, who cares, suggested next step. Produced by harness synthesis; distinct from **disposition rationale** (commitment record).

### Disposition suggestion

Optional harness text to **pre-fill** rationale; never a disposition until PM saves.

---

## Agents and surfaces

### Feature Intelligence operator

eve root agent (`agent/`) exposing tools that call `@repo/fi`. Automates the same capabilities as the human UI; does not bypass disposition rules.

### Ask-only chat

`/chat` product Q&A without FI mutation tools. **Not** part of the triage or disposition bounded context.

### Persona (UX)

Routing context for human UI—not a security role in MVP. **External** vs **internal** submitters (`?context=` on submit); **PM** and **leader** primarily use triage and insights. Same aggregate and APIs; disclosure differs per [journeys](docs/specs/feature-intelligence-journeys.md).

---

## Metrics (north-star)

| Term | Meaning |
| --- | --- |
| **Decision readiness time** | `triage_completed_at − submitted_at` |
| **PM triage effort** | `disposition_at − pm_review_started_at` (proxy from `published_at` only when labeled) |
| **Decision capture rate** | Dispositioned with rationale ÷ (dispositioned + **open queue**) |
| **Intake link rate** | Published with intake link ÷ published |
| **Open queue** | Published, disposition null |

Canonical formulas: [feature-intelligence.md § Product metrics (first)](docs/specs/feature-intelligence.md#product-metrics-first).

---

## Lifecycle statuses

| Status            | Meaning                                 |
| ----------------- | --------------------------------------- |
| `draft`           | Created, triage not finished            |
| `triaging`        | Harness running                         |
| `pending_confirm` | Awaiting submitter confirm/edit         |
| `published`       | In catalog; may lack disposition        |
| `archived`        | Out of active queues (post-MVP if used) |

---

## Related documents

- [PRODUCT.md](PRODUCT.md) — scope and initiative
- [docs/specs/feature-intelligence.md](docs/specs/feature-intelligence.md) — behavioral spec (index)
- [docs/specs/feature-intelligence-journeys.md](docs/specs/feature-intelligence-journeys.md) — personas and UI
- [docs/specs/feature-intelligence-ai-ux-patterns.md](docs/specs/feature-intelligence-ai-ux-patterns.md) — agent and chat UX
- [docs/specs/feature-intelligence-triage-harness.md](docs/specs/feature-intelligence-triage-harness.md) — harness tiers
- [docs/adr/0002-feature-intelligence-architecture.md](docs/adr/0002-feature-intelligence-architecture.md) — structure
