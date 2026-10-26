# Architecture

> Product technical contract. [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md), [GLOSSARY.md](GLOSSARY.md). Product ADRs: [docs/adr/](docs/adr/).

Inherits **[Flow Factory](.agents/flow/factory.md)** (methodology, GenUI boundaries, security). Factory detail: [.agents/flow/architecture.md](.agents/flow/architecture.md).

**Adoption:** [ADR 0001 — Use Flow Factory](docs/adr/0001-use-flow-factory.md)  
**Feature Intelligence:** [ADR 0002](docs/adr/0002-feature-intelligence-architecture.md) · [spec](docs/specs/feature-intelligence.md)

## System overview (assessment)

```text
                    ┌─────────────────┐
                    │   apps/web      │  FI UI + ask-only /api/chat
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
| `packages/fi` | Metrics, queue/CRUD, T0–T3 harness, seed, offline triage-matrix test | **Live** — degrades without gateway key |
| `packages/db` | Drizzle schema; `fi-schema.ts`; migrations through `0002_feature_intelligence` | **Live** — `pnpm db:migrate`, remote SSL in client |
| `agent/` | eve root agent; `instructions.md` + 8 tools → `@repo/fi` | **Live** — smoke evals in `evals/` |
| `apps/web` | Next.js + `eve/next`; FI routes under `app/(fi)/` | **Live** — browse, submit, triage, insights, `/chat` |
| `evals/` | eve smoke (`pnpm exec eve eval smoke`) | **Live** — migrate + seed in `evals.config.ts` |

Also available: `@repo/ui`, `@repo/genui` (not used for FI triage UI), `@repo/ts`.

## Data model (product)

Owned tables (see [spec](docs/specs/feature-intelligence.md)):

- `feature_request` — aggregate root (status lifecycle, triage fields, disposition, metric timestamps)
- `feature_request_duplicate_candidate`
- `feature_request_support`

Seed: `pnpm seed:fi` → `@repo/fi/seed/load.ts` (manifest-driven **500** rows: anchors FR-001–FR-011 + generated bulk; **never on production**). See [seed spec](docs/specs/feature-intelligence-seed.md).

PM triage queue: `listTriageQueue` orders by **support count** desc, then `published_at` desc.

Insights: `getInsights({ db, range? })` — eve omits `range` (all-time, `trends: null`); web defaults `90d` with weekly trends per [analytics spec](docs/specs/feature-intelligence-analytics.md).

## Triage pipeline

Canonical: [triage harness spec](docs/specs/feature-intelligence-triage-harness.md).

- **T0:** Lexical duplicate retrieve (top 10)
- **T1:** Deterministic theme when confidence ≥ 0.9
- **T2:** Jev `experimental_decide` — `classify-decisions.ts` (composed in `runTriageHarness`)
- **T3:** `generateObject` synthesis — `synthesize-artifact.ts` (composed in `runTriageHarness`)

Degraded path when `AI_GATEWAY_API_KEY` absent still sets `triage_completed_at` for metrics. Gateway helpers: `packages/fi/src/ai/gateway.ts`. Ask-only `/chat` uses **`ANTHROPIC_API_KEY`** (not gateway) — [ADR 0003](docs/adr/0003-feature-intelligence-model-providers.md).

## APIs and surfaces (planned vs live)

| Surface | Status |
| --- | --- |
| eve tools → `@repo/fi` | **Live** — read + `submit_request`, `confirm_request`, `support_request`, `set_disposition`, `get_request` |
| Web server actions → `@repo/fi` | **Live** — triage, submit, confirm, support, disposition |
| `POST /api/chat` ask-only | **Live** — Anthropic via `ANTHROPIC_API_KEY` |
| Postgres | **Live** when `DATABASE_URL` set — see initiative Neon plan |

## Security (inherited)

- Bounded tool inputs (Zod); disposition policy in host code, not model flags — [ADR 0011](.agents/flow/decisions/adr/0011-api-and-agent-security-boundaries.md).
- No auth in assessment slice; eve HTTP open on localhost only for demo.

## Testing

| Layer | Command / approach |
| --- | --- |
| `@repo/fi` unit | `pnpm --filter @repo/fi test` |
| Schema | `pnpm --filter @repo/db db:check` |
| eve smoke | `pnpm exec eve eval smoke` |
| FI web | agent-browser W-* — [verification log](docs/research/20261025-fi-browser-verification.md); [testing spec](docs/specs/feature-intelligence-testing.md) |

Root `pnpm test` includes `@repo/fi`.

## Deployment (Vercel demo)

| Setting | Value |
| --- | --- |
| Project | `meta-cto` (team `gaboesquivel`) |
| Git branch (source) | `meta-cto` on `gaboesquivel/flow-factory` |
| Root directory | `apps/web` |
| Build | `pnpm install --frozen-lockfile --filter web...` then `pnpm --filter web build` ([`apps/web/vercel.json`](apps/web/vercel.json); no `ignoreCommand` — always build) |
| Runtime | `next build --webpack`; `sourceFilesOutsideRootDirectory` enabled for repo-root [`agent/`](agent/) via `withEve` |
| Production URL | https://meta-cto-gaboesquivel.vercel.app |

Verify: `vercel inspect <deployment-url> -S gaboesquivel` after push. If Vercel Git **Production Branch** remains `main`, trigger production from `meta-cto` via dashboard or deployment API.

## Repository layout

```text
apps/web/app/(fi)/  # FI routes (home, requests, triage, insights, chat)
agent/              # eve Feature Intelligence operator
packages/fi/        # domain + harness (queue/list-triage-queue, requests/persist-triage-result, triage/harness-helpers, schemas/feature-request-source)
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

## React / Next.js

Route-first colocation under `apps/web/app/(fi)/` — [Factory ADR 0009](.agents/flow/decisions/adr/0009-react-nextjs-fractal-architecture.md). Server Components by default; server actions in `actions.ts` delegate to `@repo/fi`. Production build uses **`next build --webpack`** (Turbopack does not resolve `@repo/fi` `.js` import aliases).

## Quality gates

- `pnpm qa` — lint, types, tests (includes `@repo/fi`), `db:check`
- `pnpm architecture:check` — client boundaries (when UI grows)
- `pnpm --dir .agents flow:check` — documentation conventions

UI verification: [.agents/flow/operations/verification.md](.agents/flow/operations/verification.md).

## Factory navigation

- [factory.md](.agents/flow/factory.md) · [flow.md](.agents/flow/flow.md) · [Factory glossary](.agents/flow/glossary.md)

Update this file when product implementation or boundaries change materially.
