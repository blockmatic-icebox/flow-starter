# Architecture

> Generic technical contract for Flow Starter. [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) are adopter-owned templates. [docs/adr/](docs/adr/) records decisions.

Flow Starter uses a pnpm/Turborepo monorepo, with Next.js as the existing web framework and the Vercel AI SDK for optional model-backed functionality. [ADR 0008](docs/adr/0008-monorepo-turborepo-pnpm.md) owns repository organization; [ADR 0007](docs/adr/0007-monorepo-vercel-stack.md) owns platform and infrastructure direction. Vercel hosting and several agent, identity, and persistence integrations remain deployment or implementation choices, not proven shipped capabilities.

## 1. Goals

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
  ui/                       # design system (shadcn + Base UI)
  ts/                       # shared TypeScript config
docs/
  adr/                      # architecture decision records
  pdr/                      # product decision records
  specs/genui/              # GenUI extraction notes and inventory
```

Do not import server-only modules from client renderers. Share serializable types and Zod schemas across boundaries.

## 3. Generative UI: select → compile → render

| Stage | Responsibility |
| --- | --- |
| **Select** | Route the user query to tier 1 (known intent), tier 2 (declarative compound), or tier 3 (open-ended). |
| **Compile** | Parse OpenUI text, enforce component/composite allowlists, validate props with Zod, ground record references. |
| **Render** | `@repo/genui/react` maps compiled experiences to React views using the host design system. |

**Envelope:** `CompositionEnvelope` carries `openuiText`, grounded `records`, and metadata. The client consumes **NDJSON** events (`start`, `partial`, `complete`, `error`) from `POST /api/genui/compose`.

**Fixtures:** the demo uses fictional **Acme Analytics** catalog data under `packages/genui/src/fixtures/`. Adopters swap in their own record providers.

**Foundation:** OpenUI Lang (`@openuidev/lang-core`, `@openuidev/react-lang`). json-render is documented research only ([ADR 003](docs/adr/003-genui-openui-foundation.md), [2026-10-24 GenUI research](docs/research/2026-10-24-genui-json-vs-openui.md)).

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
| `/genui-demo` | GET | Client demo calling the compose API |

The compose route applies optional per-IP daily limits (`apps/web/lib/genui/`, off on `flow.localhost` unless `GENUI_ENFORCE_RATE_LIMIT=1`) and builds a minimal capability context (`correlationId`, `ip`, `clock`). Telemetry and Redis-backed caps follow the gaboesquivel.com pattern in `docs/specs/genui/INVENTORY.md`.

The in-memory cap store is a demonstration mechanism, not a distributed production rate limiter. Its counts are process-local and may reset or diverge across instances. The request IP is derived from forwarding headers, whose trust depends on the hosting proxy configuration. Production applications must replace this with an appropriately trusted, distributed enforcement mechanism.

## 7. Planned platform integrations

These are specified for adopters building a full workspace; they are **not required** to run the GenUI demo.

| Area | Direction |
| --- | --- |
| Agent runtime | **eve** — single agent, `defineTool` adapters to shared actions |
| Identity | **Better Auth** with GitHub OAuth |
| Persistence | **Neon** + **Drizzle** via Vercel integration |
| Docs / retrieval | Fumadocs, bounded repo reads, revision-aware citations |
| External clients | Read-only invocation boundary (ADR 006) |

Voice (ADR 004) and `/dev` workspace placement (ADR 005) apply when those features are implemented.

## 8. Quality and CI

Local gates: `pnpm flow:test` validates Flow naming rules, `pnpm qa` runs non-mutating documentation, lint, type, and unit checks, and `pnpm ci:local` additionally performs a production build.

GitHub Actions: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and [`.github/workflows/genui-quality.yml`](.github/workflows/genui-quality.yml) — **disabled for push/PR** until uncommented. Optional DeepSec workflow remains separate.

GenUI unit tests: `pnpm --filter @repo/genui test`. Eval matrix: `packages/genui/src/eval/query-matrix.ts`.

## 9. Adoption path

1. Fork and replace **PRODUCT.md** / **DESIGN.md**.
2. Swap Acme fixtures and routing keywords for your domain.
3. Extend `packages/genui` component registry and React views.
4. Add auth, persistence, and eve tools when the workspace ships.
5. Enable CI triggers when the remote repository is ready.

## 10. Delivery status

Current milestone order, progress, and acceptance goals are maintained in [ROADMAP.md](ROADMAP.md).

This architecture document owns technical boundaries and intended system structure, not a competing delivery task list.
