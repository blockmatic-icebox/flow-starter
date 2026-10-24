# Architecture

> Generic technical contract for Flow Starter. [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) are adopter-owned templates. [docs/adr/](docs/adr/) records decisions.

Flow Starter follows the [Agentic Architecture foundation](docs/adr/0001-agentic-architecture.md): capability-first operations, validated human and agent interfaces, Vercel-aligned infrastructure, and an integrated TypeScript monorepo. This document describes the current technical structure and implementation status. The foundational ADR explains technology selection and trade-offs; historical ADR 0007 and ADR 0008 have been consolidated into it.

## 1. Goals

Flow Starter is an **opinionated Next.js and React** baseline for agentic applications. The application framework is a chosen part of the starter, not an interchangeable option adopters reselect from scratch.

Flow Starter demonstrates how to build **agentic applications** with:

- **Generative UI** that never executes arbitrary model output—only validated OpenUI Lang documents rendered through an allowlisted component catalog.
- **Composition tiers**: controlled intents, declarative multi-section stacks, and optional model-backed open-ended answers.
- **Shared actions** (planned): UI controls and agents call the same authorized server operations; privileged actions are registered by the host, not deserialized from model text.
- **Vercel-aligned defaults**: Next.js App Router, optional AI Gateway for models, preview-friendly builds.
- **Capability-first interfaces:** reusable validated operations for human applications and agent consumers, exposed through HTTP, MCP, or other interfaces only when needed ([PDR 0001](docs/pdr/0001-agnostic-api-first.md)).

The checkout is a **baseline**, not a finished product. Replace fixtures, routes, and templates; keep `@repo/genui` contracts.

## 2. Repository layout

```text
apps/web/
  app/                      # routes, API handlers
  app/api/genui/compose/    # NDJSON compose stream
  app/genui-demo/           # integration example
packages/
  genui/                    # @repo/genui — compiler, orchestration, React adapter
  db/                       # @repo/db — Drizzle schema, client, migrations
  ui/                       # design system (shadcn + Base UI)
  ts/                       # shared TypeScript config
docker-compose.yml          # Neon Local proxy (optional local Postgres endpoint)
docs/
  adr/                      # architecture decision records
  pdr/                      # product decision records
  specs/genui/              # GenUI extraction notes and inventory
```

Do not import server-only modules from client renderers. Share serializable types and Zod schemas across boundaries.

## React and Next.js application architecture

Flow Starter provides an opinionated React/Next.js application foundation.

React code follows [ADR 0009 — React and Next.js Fractal Architecture](docs/adr/0009-react-nextjs-fractal-architecture.md).

Core conventions:

- Fractal, feature-oriented colocation.
- Composition over large flag-driven components.
- AHA — Avoid Hasty Abstractions.
- Server Components by default.
- Client Components at necessary interactive boundaries.
- nuqs for shareable URL state.
- Local state for ephemeral interaction.
- Deliberate server and client remote-data strategies.
- Shared visual primitives from `@repo/ui`.
- Domain-specific code retained near the owning feature.
- Typed capability contracts for agent and application adapters.
- GenUI renderers following the same React architecture.

Adopters use this architecture rather than designing an alternative React structure from scratch.

The implementation and current package boundaries are described here; the rationale and enforcement requirements belong in ADR 0009.

## 3. Generative UI: select → compile → render

| Stage | Responsibility |
| --- | --- |
| **Select** | Route the user query to tier 1 (known intent), tier 2 (declarative compound), or tier 3 (open-ended). |
| **Compile** | Parse OpenUI text, enforce component/composite allowlists, validate props with Zod, ground record references. |
| **Render** | `@repo/genui/react` maps compiled experiences to React views using the host design system. |

**Envelope:** `CompositionEnvelope` carries `openuiText`, grounded `records`, and metadata. The client consumes **NDJSON** events (`start`, `partial`, `complete`, `error`) from `POST /api/genui/compose`.

**Fixtures:** the demo uses fictional **Acme Analytics** catalog data under `packages/genui/src/fixtures/`. Adopters swap in their own record providers.

**Foundation:** OpenUI Lang (`@openuidev/lang-core`, `@openuidev/react-lang`). json-render is documented research only ([ADR 003](docs/adr/0003-genui-openui-foundation.md), [2026-10-24 GenUI research](docs/research/20261024-genui-json-vs-openui.md)).

## 4. Composition tiers

| Tier | Name | Mechanism |
| --- | --- | --- |
| 1 | Controlled | Deterministic intent routing → single experience (e.g. comparison, collection, status). |
| 2 | Declarative | Keyword-driven **SectionStack** of approved child expressions. |
| 3 | Open-ended answer | Optional AI Gateway-backed prose inside a validated Answer experience; grounded fallback without credentials. Does not generate arbitrary component trees. |

Tier 1–2 paths are fully testable without network access. Tier 3 is optional (ADR 002).

## 5. Actions and security

- **Registered actions** live in a host-owned registry (`createActionRegistry`). Kinds include navigate, filter, sort, server-tool, etc.
- Model output **does not** define privileged actions. Invocations require schema validation; sensitive operations set `requiresApproval` / `requiresAuth`.
- Compose and render paths treat external text as untrusted: injection patterns route to safe **Answer** or **Status** experiences.

Registered actions, input validation, and declared approval/authentication requirements are foundational contracts. Actual privileged execution and end-to-end user authorization must be implemented and verified by the host. The current registry is not a completed cross-channel authorization system.

## 6. API surface (implemented)

| Endpoint | Method | Role |
| --- | --- | --- |
| `/api/genui/compose` | POST | Body: `{ query, clientRequestId?, version? }`. Returns `application/x-ndjson` stream. |
| `/api/chat` | POST | Site consultant: AI SDK UI message stream; optional AI Gateway; deterministic fallback without credentials. |
| `/api/mcp` | GET, POST, DELETE | Read-only MCP (Streamable HTTP) for external agents; same consultant tools as chat. |
| `/genui-demo` | GET | Client demo calling the compose API |

The compose and consultant routes apply optional per-IP daily limits (`apps/web/lib/genui/`, off on `flow.localhost` unless `GENUI_ENFORCE_RATE_LIMIT=1`) and build a minimal capability context (`correlationId`, `ip`, `clock`). Consultant MCP is read-only for external callers ([ADR 006](docs/adr/0006-external-invocation-is-read-only.md)); in-app chat may invoke allowlisted client actions (`open-genui-demo`, `toggle-theme`). Agent-to-UI events in the sidebar use the AI SDK UI message stream (AG-UI vocabulary per [ADR 0010](docs/adr/0010-site-consultant-chat-and-mcp.md)). Telemetry and Redis-backed caps follow the gaboesquivel.com pattern in `docs/specs/genui/inventory.md`.

The in-memory cap store is a demonstration mechanism, not a distributed production rate limiter. Its counts are process-local and may reset or diverge across instances. The request IP is derived from forwarding headers, whose trust depends on the hosting proxy configuration. Production applications must replace this with an appropriately trusted, distributed enforcement mechanism.

## 7. Planned platform integrations

These are specified for adopters building a full workspace; they are **not required** to run the GenUI demo.

| Area | Direction |
| --- | --- |
| Agent runtime | **eve** — single agent, `defineTool` adapters to shared actions |
| Identity | **Better Auth** with GitHub OAuth |
| Persistence (product) | Application tables, auth data, and preview **branch-per-PR** automation (planned) |
| Persistence (baseline) | **@repo/db** — Drizzle + `postgres.js`, committed migrations, **Neon Local** via `pnpm db:start`; previews use `DATABASE_URL` from Neon or Vercel |
| Docs / retrieval | Fumadocs, bounded repo reads, revision-aware citations |
| External clients | Read-only invocation boundary (ADR 006) |

Site consultant chat and read-only MCP are implemented per [ADR 0010](docs/adr/0010-site-consultant-chat-and-mcp.md). Eve workspace voice (ADR 004) and `/dev` placement (ADR 005) apply when those features are implemented.

## 8. Quality and CI

Local gates:

- `pnpm qa` — Flow docs, React architecture boundaries, lint, knip, sherif, types, unit tests, and `drizzle-kit check` for `@repo/db` (no database required).
- `pnpm hooks:pre-commit` — staged secret-file block, gitleaks on staged changes, then `pnpm qa` (non-mutating).
- `pnpm security:check` — full gitleaks, OSV, and `pnpm audit` (requires gitleaks and osv-scanner; see `pnpm setup`).
- `pnpm ci:local` — `pnpm qa`, `pnpm test:scripts`, `pnpm security:check`, and production build.

GitHub Actions: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and [`.github/workflows/security.yml`](.github/workflows/security.yml) mirror the local gates but remain **disabled for push/PR** on CI until uncommented. [`.github/workflows/pr-title.yml`](.github/workflows/pr-title.yml) enforces Conventional Commits on PR titles. DeepSec stays manual in [`.github/workflows/deepsec.yml`](.github/workflows/deepsec.yml).

GenUI unit tests: `pnpm --filter @repo/genui test`. Eval matrix: `packages/genui/src/eval/query-matrix.ts`.

### Local Neon database

Neon Local is a Docker proxy to a cloud branch (not an offline Postgres engine). Copy `.env.defaults.example` to `.env`, set `NEON_API_KEY` and `NEON_PROJECT_ID`, then `pnpm db:start`, `pnpm db:migrate`, and `pnpm db:ping`. Default URL: `postgres://neon:npg@localhost:5432/neondb?sslmode=require`. The GenUI demo does not connect to the database until adopters wire `@repo/db` into application features.

## 9. Adoption path

1. Create a product from Flow Starter and personalize README.md.
2. Define product intent, audience and capabilities in PRODUCT.md.
3. Define the visual and interaction direction in DESIGN.md.
4. Replace fictional fixtures and optional example interfaces when appropriate.
5. Extend the established application capabilities, shared UI and GenUI contracts.
6. Implement optional identity, persistence and agent runtime integrations when the product needs them.
7. Run the existing quality checks and verify the application before deployment.

## 10. Implementation status

This document describes the current technical baseline and intended system boundaries.

Implemented and planned capabilities must be identified accurately in their relevant architecture sections.

The inherited foundation's mission, goals and capabilities are explained in [docs/readme.md](docs/readme.md).

Product-specific delivery work can be managed through Flow's existing initiatives, optional plans and specifications when appropriate.

Do not introduce a separate mandatory planning document.

Update the relevant architectural contract when the implementation materially changes.
