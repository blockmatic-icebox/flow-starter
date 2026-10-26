# Meta CTO — Product

## Purpose

**Feature Intelligence** (human UI brand: **hunch**) helps product teams turn unstructured feature requests—from customers, prospects, support, and internal stakeholders—into **clear, actionable product decisions** with measurable outcomes (readiness, triage effort, capture rate, intake linking).

This checkout is the Meta CTO technical assessment on [Flow Factory](.agents/flow/factory.md): methodology, quality gates, and agent-ready patterns (`apps/web`, `@repo/fi`, `@repo/genui`, eve).

**Hunch redesign:** [initiative](docs/initiatives/hunch-redesign.md) · [GenUI spec](docs/specs/hunch-genui.md) · [tasks](docs/tasks/hunch-redesign.md) · [phase 2 hardening](docs/tasks/hunch-hardening.md). UI brand **hunch**; domain language remains Feature Intelligence ([GLOSSARY.md](GLOSSARY.md#hunch-ui-brand)).

**MCP App:** [initiative](docs/initiatives/hunch-mcp-app.md) · [spec](docs/specs/hunch-mcp-app.md) · [tasks](docs/tasks/hunch-mcp-app.md).

## Users and jobs

| User | Job |
| --- | --- |
| **External submitter** (customer, prospect) | Quick feedback; plain-language confirm; optional link to similar ideas |
| **Internal submitter** (support, sales) | Paste tickets; duplicates-first confirm; avoid new duplicate rows |
| **Product manager** (primary demo persona) | Inline triage queue; **dispositions** with rationale |
| **Product leader** (secondary) | **Insights** trends (90d default), backlog/queue panels, audit on detail |
| **Automation / agents** | eve operator over `@repo/fi` — human-in-the-loop before publish/disposition |

## Capabilities (accepted scope)

| Capability | Description |
| --- | --- |
| **AI intake gate** | Triage harness structures submissions before catalog publish |
| **Discover & support** | Browse published requests; express support |
| **PM triage** | Queue, disposition, merge/link semantics per [glossary](GLOSSARY.md) |
| **Metrics** | North-star insights + **90d trends** (submissions, queue depth, themes) from persisted timestamps |
| **Demo history** | Deterministic **500-row** seed for leader/PM narrative ([seed spec](docs/specs/feature-intelligence-seed.md)) |
| **Agent access** | eve operator with typed tools (no duplicate business logic in prompts) |
| **Ask-only chat** | Secondary `/chat` Q&A—no FI mutations (MVP cut line) |
| **Persona UX** | Home router, progressive disclosure, AI UX patterns ([journeys](docs/specs/feature-intelligence-journeys.md), [AI UX](docs/specs/feature-intelligence-ai-ux-patterns.md)) |

Detailed requirements: [feature-intelligence.md](docs/specs/feature-intelligence.md) (spec index) — eve, harness, [seed](docs/specs/feature-intelligence-seed.md), [analytics](docs/specs/feature-intelligence-analytics.md), testing, journeys, AI UX patterns.

## Implementation status

| Area | Status |
| --- | --- |
| **Specification** | **MVP + demo depth specified**; **[workflow remediation](docs/specs/feature-intelligence-remediation.md) accepted** (Specify 2026-10-25) — [initiative](docs/initiatives/feature-intelligence.md) |
| **Database** | **Live** — Vercel build: `db:migrate` + **if-empty** seed (`FI_SEED_IF_EMPTY`); local full reseed via `pnpm seed:fi` ([seed spec](docs/specs/feature-intelligence-seed.md)) |
| **Domain (`@repo/fi`)** | **Live** — disposition validation, merge rollup, discovery pagination, degraded triage flags ([remediation](docs/specs/feature-intelligence-remediation.md)) |
| **eve (`agent/`)** | **Live** — behavioral smoke evals (AG-7, owned confirm/monitor/merge); `pnpm exec eve eval smoke` |
| **Human UI (`apps/web`)** | **Live** — **Hunch** shell (Overview, Feedback, Triage, Insights, Ask Hunch, `/dev`); PM Overview dashboard, trustworthy period metrics; legacy URL redirects |
| **Agentic discoverability** | **Live** — `llms.txt`, well-known MCP, Streamable HTTP `/api/mcp` (open demo tools), `pnpm agentic:check` ([spec](docs/specs/feature-intelligence-agentic-discoverability.md)) |
| **MCP App (Hunch Explorer)** | **Planned** — interactive `ui://hunch/explorer` for Apps-capable hosts; non-UI fallback required ([initiative](docs/initiatives/hunch-mcp-app.md), [spec](docs/specs/hunch-mcp-app.md)) |
| **Deployment (demo)** | **Live** — Vercel `meta-cto`, https://meta-cto-two.vercel.app (`DATABASE_URL`, gateway/Anthropic keys on Production) |

**Build:** [Remediation tasks](docs/tasks/feature-intelligence-remediation.md) implemented on `meta-cto` (2026-10-26). Adversarial reconciliation: [research](docs/research/20261025-fi-adversarial-review.md). W-3 near-duplicate **partial** (lexical by design).

## Success metrics

Canonical definitions and `getInsights` contract: [Product metrics (first)](docs/specs/feature-intelligence.md#product-metrics-first).

- Decision readiness time
- PM triage effort
- Decision capture rate (open-queue denominator)
- Intake link rate (supporting)

Trend definitions and range behavior: [feature-intelligence-analytics.md](docs/specs/feature-intelligence-analytics.md).

## Ubiquitous language

Use [GLOSSARY.md](GLOSSARY.md) for domain terms (feature request, disposition, intake link vs merge, decision-ready, etc.). Factory terms: [.agents/flow/glossary.md](.agents/flow/glossary.md).

## Related documents

- [Glossary](GLOSSARY.md)
- [Design](DESIGN.md)
- [Architecture](ARCHITECTURE.md)
- [Initiative](docs/initiatives/feature-intelligence.md)
- [Tasks — demo depth](docs/tasks/feature-intelligence-demo-depth.md)
- [Remediation spec](docs/specs/feature-intelligence-remediation.md) · [ADR 0004](docs/adr/0004-fi-workflow-integrity-and-safety.md) · [Adversarial research](docs/research/20261025-fi-adversarial-review.md)
- [ADR 0001 — Use Flow Factory](docs/adr/0001-use-flow-factory.md)
- [ADR 0002 — Feature Intelligence architecture](docs/adr/0002-feature-intelligence-architecture.md)
- [ADR 0003 — Model providers (gateway vs Anthropic)](docs/adr/0003-feature-intelligence-model-providers.md)
