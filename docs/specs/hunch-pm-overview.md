# Hunch — PM Overview and navigation language

**Status:** Current  
**Last reviewed:** 2026-10-26  
**Related:** [hunch-genui.md](./hunch-genui.md) · [feature-intelligence-analytics.md](./feature-intelligence-analytics.md) · [initiative](../initiatives/hunch-redesign.md)

## Navigation (UI labels; routes unchanged)

| Route | UI name | Subtitle |
| --- | --- | --- |
| `/` | Overview | See what needs attention and how feedback is becoming decisions. |
| `/signals` | Feedback | Explore customer feedback, requests, and supporting evidence. |
| `/review` | Triage | Review feedback and record what happens next. |
| `/patterns` | Insights | Understand recurring themes and changes in demand. |
| `/ask` | Ask Hunch | (existing ask copy) |
| `/dev` | Developer overview | Agent and MCP connection guidance. |

Legacy redirects (`/triage` → `/review`, `/insights` → `/patterns`, `/developers` → `/dev`) unchanged in behavior.

## Overview sections (`/`)

### A. Needs attention

Deterministic rules (priority order); dedupe by request id; cap 8 with `totalCount` for “View all”.

1. Published, no disposition — awaiting PM review (age from `published_at`) → `/review?focus={id}`
2. Published, degraded triage (`triage_steps.degraded` or `needs_ai_review`) → `/review?focus={id}`
3. `pending_confirm`, duplicate candidates, no `intake_linked_request_id` → `/feedback/new?resume={id}`
4. `pending_confirm`, degraded triage → same resume link

Do not mix pending confirm with published without distinct copy and action.

### B. Outcome metrics

Four north-star metrics from `getInsights` only (`@repo/fi`):

- Decision readiness (avg) — period (Overview default 30d); disclose `readinessDegradedN` when &gt; 0.
- Elapsed PM review time (median) — period; label **elapsed**; proxy footnote when `pmTriageN &lt; 2`.
- Decision capture rate — **live snapshot** at `computedAt`.
- Intake link rate — period; no “higher is better” claim.

Use “Not enough data” for null values; never show unavailable queue as zero.

### C. Demand changes

Top themes from `getInsights({ range: "30d" }).trends.themes` with count, prior delta, link `/signals?theme=`.

### D. Recent decisions

`listRecentDecisions` with rationale excerpt; decision ≠ shipped feature.

## Non-goals

- URL migration for product routes.
- Client timers for PM active time.
- New MCP tool names for attention list (web imports domain directly).
