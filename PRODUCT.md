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
| **Product leader** (secondary) | Read-only **Insights** + audit on detail |
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
| **Specification** | Complete — [tasks](docs/tasks/feature-intelligence.md) (execution) + [initiative](docs/initiatives/feature-intelligence.md) (scope) |
| **Database** | Schema + migration in repo; **apply** at Build (Wave 0 — Neon Path A or B) |
| **Domain (`@repo/fi`)** | Spike: metrics, T0/T1, partial harness, gateway helper, seed; **T2/T3 + CRUD** in tasks |
| **eve (`agent/`)** | Spike: 3 tools + instructions; **remaining tools + evals** in tasks |
| **Human UI (`apps/web`)** | Not started — Wave 3 tasks |

**Build order:** Waves 0→4 in [docs/tasks/feature-intelligence.md](docs/tasks/feature-intelligence.md).

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
