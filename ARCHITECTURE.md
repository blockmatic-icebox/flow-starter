# Architecture

> Product technical contract. [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md), [GLOSSARY.md](GLOSSARY.md). Product ADRs: [docs/adr/](docs/adr/).

Inherits **[Flow Factory](.agents/flow/factory.md)** (methodology, GenUI boundaries, security). Factory detail: [.agents/flow/architecture.md](.agents/flow/architecture.md).

**Adoption:** [ADR 0001 — Use Flow Factory](docs/adr/0001-use-flow-factory.md)  
**Feature Intelligence:** [ADR 0002](docs/adr/0002-feature-intelligence-architecture.md) · [spec](docs/specs/feature-intelligence.md)

## System overview (assessment)

```text
                    ┌─────────────────┐
                    │   apps/web      │  Human UI (planned)
                    │  server actions │
                    └────────┬────────┘
                             │
┌──────────────┐             │             ┌──────────────┐
│ agent/       │── tools ────┼────────────►│  @repo/fi    │
│ (eve)        │             │             │  domain +    │
└──────────────┘             │             │  triage      │
                             │             └──────┬───────┘
                             │                    │
                             ▼                    ▼
                      ┌──────────────────────────────┐
                      │  @repo/db  (Postgres/Drizzle) │
                      │  feature_request + related    │
                      └──────────────────────────────┘
```

**Rule:** Business logic lives in **`@repo/fi`**. Web and eve are adapters ([Factory PDR 0001](.agents/flow/decisions/pdr/0001-agnostic-api-first.md)).

## Components

| Path | Role | Implementation status |
| --- | --- | --- |
| `packages/fi` | Metrics (`computeInsights`), triage harness, `searchRequests`, `listTriageQueue`, `getInsights`, seed | **In progress** — harness partial (T1 + lexical; Jev/T3 next) |
| `packages/db` | Drizzle schema; `fi-schema.ts`; migrations through `0002_feature_intelligence` | **Committed** — apply with `pnpm db:migrate` at Build (Wave 0) |
| `agent/` | eve root agent; `instructions.md` + tools → `@repo/fi` | **Partial** — 3 tools live; AI UX turn contract in instructions |
| `apps/web` | Next.js product; future `eve/next` host | **Starter only** — no FI routes yet |
| `evals/` | eve smoke (planned) | **Not added** |

Also available: `@repo/ui`, `@repo/genui` (not used for FI triage UI), `@repo/ts`.

## Data model (product)

Owned tables (see [spec](docs/specs/feature-intelligence.md)):

- `feature_request` — aggregate root (status lifecycle, triage fields, disposition, metric timestamps)
- `feature_request_duplicate_candidate`
- `feature_request_support`

Seed: `pnpm seed:fi` → `@repo/fi/seed/load.ts` (deterministic FR-001–FR-011 per [seed spec](docs/specs/feature-intelligence-seed.md)).

## Triage pipeline

Canonical: [triage harness spec](docs/specs/feature-intelligence-triage-harness.md).

- **T0:** Lexical duplicate retrieve (top 10)
- **T1:** Deterministic theme when confidence ≥ 0.9
- **T2:** Jev `experimental_decide` (planned in code)
- **T3:** `generateObject` synthesis (planned)

Degraded path when `AI_GATEWAY_API_KEY` absent still sets `triage_completed_at` for metrics. Gateway helpers: `packages/fi/src/ai/gateway.ts`. Ask-only `/chat` uses **`ANTHROPIC_API_KEY`** (not gateway) — [ADR 0003](docs/adr/0003-feature-intelligence-model-providers.md).

## APIs and surfaces (planned vs live)

| Surface | Status |
| --- | --- |
| eve tools → `@repo/fi` | Partial (3 tools) |
| Web server actions → `@repo/fi` | Not implemented |
| `POST /api/chat` ask-only | Not implemented |
| Postgres | Schema in repo; **connect at Build** — Path A `DATABASE_URL` or Path B Neon Local ([initiative plan](docs/initiatives/feature-intelligence.md#plan--postgres--neon-connectivity)) |

## Security (inherited)

- Bounded tool inputs (Zod); disposition policy in host code, not model flags — [ADR 0011](.agents/flow/decisions/adr/0011-api-and-agent-security-boundaries.md).
- No auth in assessment slice; eve HTTP open on localhost only for demo.

## Testing

| Layer | Command / approach |
| --- | --- |
| `@repo/fi` unit | `pnpm --filter @repo/fi test` |
| Schema | `pnpm --filter @repo/db db:check` |
| eve smoke | `eve eval smoke` (when `evals/` added) |
| FI web | Manual — [testing spec](docs/specs/feature-intelligence-testing.md) |

Root `pnpm test` includes `@repo/fi`.

## Repository layout

```text
apps/web/           # product UI (starter today)
agent/              # eve Feature Intelligence operator
packages/fi/        # domain + harness
packages/db/        # Drizzle + FI migration
docs/adr/           # product ADRs
docs/specs/         # FI specifications (see main spec index)
docs/tasks/         # execution checklists (separate from specs)
docs/plans/         # optional standalone plans
docs/initiatives/   # active initiative
PRODUCT.md          # product contract
DESIGN.md           # experience contract
GLOSSARY.md         # ubiquitous language
ARCHITECTURE.md     # this file
.agents/            # Flow Factory (not imported by product)
```

## React / Next.js (when UI ships)

Route-first colocation under `apps/web/app/` — [Factory ADR 0009](.agents/flow/decisions/adr/0009-react-nextjs-fractal-architecture.md). Server Components by default; server actions delegate to `@repo/fi`.

## Quality gates

- `pnpm qa` — lint, types, tests (includes `@repo/fi`), `db:check`
- `pnpm architecture:check` — client boundaries (when UI grows)
- `pnpm --dir .agents flow:check` — documentation conventions

UI verification: [.agents/flow/operations/verification.md](.agents/flow/operations/verification.md).

## Factory navigation

- [factory.md](.agents/flow/factory.md) · [flow.md](.agents/flow/flow.md) · [Factory glossary](.agents/flow/glossary.md)

Update this file when product implementation or boundaries change materially.
