# Meta CTO — Product

## Purpose

**Feature Intelligence** helps product teams turn unstructured feature requests—from customers, prospects, support, and internal stakeholders—into **clear, actionable product decisions** with measurable outcomes (readiness, triage effort, capture rate, intake linking).

This checkout is the Meta CTO technical assessment on [Flow Factory](.agents/flow/factory.md): methodology, quality gates, and agent-ready patterns (`apps/web`, `@repo/fi`, eve).

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
| **Metrics** | North-star insights driven by persisted timestamps |
| **Agent access** | eve operator with typed tools (no duplicate business logic in prompts) |
| **Ask-only chat** | Secondary `/chat` Q&A—no FI mutations (MVP cut line) |
| **Persona UX** | Home router, progressive disclosure, AI UX patterns ([journeys](docs/specs/feature-intelligence-journeys.md), [AI UX](docs/specs/feature-intelligence-ai-ux-patterns.md)) |

Detailed requirements: [feature-intelligence.md](docs/specs/feature-intelligence.md) (spec index) — eve, harness, seed, testing, journeys, AI UX patterns.

## Implementation status

| Area | Status |
| --- | --- |
| **Specification** | Complete — [tasks](docs/tasks/feature-intelligence.md) + [initiative](docs/initiatives/feature-intelligence.md) |
| **Database** | **Live** with `DATABASE_URL` — migrate; demo seed **500** rows (`pnpm seed:fi`, dev/CI only) |
| **Domain (`@repo/fi`)** | **Live** — full T0–T3 harness orchestration; **degraded** when `AI_GATEWAY_API_KEY` absent |
| **eve (`agent/`)** | **Live** — MVP tools, `evals/` smoke (AG-7), `pnpm exec eve eval smoke` |
| **Human UI (`apps/web`)** | **Live** — `app/(fi)/` routes, server actions, ask-only `/chat`; [browser verification](docs/research/20261025-fi-browser-verification.md) |
| **Deployment (demo)** | **Live** — Vercel project `meta-cto`, branch `meta-cto`, production https://meta-cto-gaboesquivel.vercel.app (Vercel Authentication may require sign-in or share link; env: `DATABASE_URL`, `AI_GATEWAY_API_KEY`, `ANTHROPIC_API_KEY` on Production) |

**Build checklist:** [assessment MVP](docs/tasks/feature-intelligence.md) complete; [demo depth](docs/tasks/feature-intelligence-demo-depth.md) (500 seed + analytics) complete. Analytics spec: [feature-intelligence-analytics.md](docs/specs/feature-intelligence-analytics.md).

**Spec compliance:** MVP acceptance criteria AC-1–AC-8 are met for assessment scope; W-3 near-duplicate live submit is **partial** in manual pass (lexical harness still surfaces seeded candidates when text overlaps). See [spec verification](docs/specs/feature-intelligence.md#verification-mvp) and browser log.

## Success metrics

Canonical definitions and `getInsights` contract: [Product metrics (first)](docs/specs/feature-intelligence.md#product-metrics-first).

- Decision readiness time
- PM triage effort
- Decision capture rate (open-queue denominator)
- Intake link rate (supporting)

## Ubiquitous language

Use [GLOSSARY.md](GLOSSARY.md) for domain terms (feature request, disposition, intake link vs merge, decision-ready, etc.). Factory terms: [.agents/flow/glossary.md](.agents/flow/glossary.md).

## Related documents

- [Glossary](GLOSSARY.md)
- [Design](DESIGN.md)
- [Architecture](ARCHITECTURE.md)
- [Initiative](docs/initiatives/feature-intelligence.md)
- [ADR 0001 — Use Flow Factory](docs/adr/0001-use-flow-factory.md)
- [ADR 0002 — Feature Intelligence architecture](docs/adr/0002-feature-intelligence-architecture.md)
- [ADR 0003 — Model providers (gateway vs Anthropic)](docs/adr/0003-feature-intelligence-model-providers.md)
