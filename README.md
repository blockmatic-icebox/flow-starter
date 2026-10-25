# Meta CTO — Feature Intelligence

Web application built with Flow Factory.

Technical assessment: turn unstructured feature requests into **clear product decisions** with an AI intake gate, PM triage queue, and metrics-first insights.

**Architecture:** Human UI and eve agent both call **`@repo/fi`** (no duplicated business logic). Postgres via **`@repo/db`**. See [ADR 0002](docs/adr/0002-feature-intelligence-architecture.md).

```text
Submit → triage harness (T0–T3) → pending confirm → published → PM disposition → Insights
```

North-star metrics (decision readiness, PM effort, capture rate, intake link rate) are defined in [Product metrics](docs/specs/feature-intelligence.md#product-metrics-first) and surfaced on `/insights`.

## Development

Requires Node.js 24+ and pnpm 12+.

```bash
pnpm setup
cp .env.defaults.example .env   # then set DATABASE_URL (Neon) and keys below
pnpm db:migrate
pnpm seed:fi
pnpm dev                        # https://meta-cto.localhost (portless) or pnpm dev:app --port 3000
```

### Environment

| Variable             | Purpose                                       |
| -------------------- | --------------------------------------------- |
| `DATABASE_URL`       | Postgres (Neon Path A or local proxy)         |
| `AI_GATEWAY_API_KEY` | Triage harness Jev + synthesis via AI Gateway |
| `ANTHROPIC_API_KEY`  | Ask-only `/chat` (no FI mutations)            |

### Quality and agents

```bash
pnpm qa
pnpm build:web                  # webpack build (FI monorepo packages)
pnpm exec eve eval smoke        # eve smoke evals (migrate + seed in evals.config.ts)
pnpm --filter web test:browser  # starter smoke only
```

Manual FI checklist: [testing spec](docs/specs/feature-intelligence-testing.md). Logged pass: [browser verification](docs/research/20261025-fi-browser-verification.md).

**Prompt log:** Local gitignored `prompts.txt` at repo root (assessment collaboration trail; not committed).

## Product documentation

- [Product](PRODUCT.md) — Purpose, scope, implementation status
- [Design](DESIGN.md) — Experience direction and Meta CTO UI
- [Architecture](ARCHITECTURE.md) — Components, triage pipeline, testing
- [Glossary](GLOSSARY.md) — Domain language
- [Specs index](docs/specs/feature-intelligence.md) — Requirements and acceptance
- [Tasks](docs/tasks/feature-intelligence.md) — Build checklist
- [Agent instructions](AGENTS.md) — Development conventions

## Workflow

This project uses [Flow](.agents/flow/README.md) to guide product development.
