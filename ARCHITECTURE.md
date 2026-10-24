# Architecture

> Generic technical contract for Flow Starter. [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) are adopter-owned templates. [docs/adr/](docs/adr/) records decisions.

## 1. Goals

Flow Starter demonstrates how to build **agentic applications** with:

- **Generative UI** that never executes arbitrary model output—only validated OpenUI Lang documents rendered through an allowlisted component catalog.
- **Composition tiers**: controlled intents, declarative multi-section stacks, and optional model-backed open-ended answers.
- **Shared actions** (planned): UI controls and agents call the same authorized server operations; privileged actions are registered by the host, not deserialized from model text.
- **Vercel-aligned defaults**: Next.js App Router, optional AI Gateway for models, preview-friendly builds.

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

**Foundation:** OpenUI Lang (`@openuidev/lang-core`, `@openuidev/react-lang`). json-render is documented research only (ADR 0005).

## 4. Composition tiers

| Tier | Name | Mechanism |
| --- | --- | --- |
| 1 | Controlled | Deterministic intent routing → single experience (e.g. comparison, collection, status). |
| 2 | Declarative | Keyword-driven **SectionStack** of approved child expressions. |
| 3 | Generative | Optional `ai` + AI Gateway for prose; falls back to grounded **Answer** without credentials. |

Tier 1–2 paths are fully testable without network access. Tier 3 is optional (ADR 002).

## 5. Actions and security

- **Registered actions** live in a host-owned registry (`createActionRegistry`). Kinds include navigate, filter, sort, server-tool, etc.
- Model output **does not** define privileged actions. Invocations require schema validation; sensitive operations set `requiresApproval` / `requiresAuth`.
- Compose and render paths treat external text as untrusted: injection patterns route to safe **Answer** or **Status** experiences.

## 6. API surface (implemented)

| Endpoint | Method | Role |
| --- | --- | --- |
| `/api/genui/compose` | POST | Body: `{ query, clientRequestId?, version? }`. Returns `application/x-ndjson` stream. |
| `/genui-demo` | GET | Client demo calling the compose API |

Rate limiting, capability context, and telemetry hooks are **host responsibilities**—see gaboesquivel.com compose route as a reference pattern in `docs/specs/genui/INVENTORY.md`.

## 7. Planned platform integrations

These are specified for adopters building a full workspace; they are **not required** to run the GenUI demo.

| Area | Direction |
| --- | --- |
| Agent runtime | **eve** — single agent, `defineTool` adapters to shared actions |
| Identity | **Better Auth** with GitHub OAuth |
| Persistence | **Neon** + **Drizzle** via Vercel integration |
| Docs / retrieval | Fumadocs, bounded repo reads, revision-aware citations |
| External clients | Read-only invocation boundary (ADR 0004) |

Voice (ADR 0002) and `/dev` workspace placement (ADR 0003) apply when those features are implemented.

## 8. Quality and CI

Local gate: `pnpm qa` (lint, types, unit tests) and `pnpm build`.

GitHub Actions: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — **disabled for push/PR** until uncommented. Optional DeepSec workflow remains separate.

GenUI unit tests: `pnpm --filter @repo/genui test`. Eval matrix: `packages/genui/src/eval/query-matrix.ts`.

## 9. Adoption path

1. Fork and replace **PRODUCT.md** / **DESIGN.md**.
2. Swap Acme fixtures and routing keywords for your domain.
3. Extend `packages/genui` component registry and React views.
4. Add auth, persistence, and eve tools when the workspace ships.
5. Enable CI triggers when the remote repository is ready.

## 10. Implementation sequence

Ordered work for this repository. Close each step with evidence (`pnpm qa`, preview smoke, or documented manual check) before expanding scope.

| Step | Status | Work |
| --- | --- | --- |
| GenUI foundation | **Done** | `@repo/genui`, `/genui-demo`, `POST /api/genui/compose`, CI workflow (local + optional remote) |
| 1. Foundation spike | Pending | eve + Next.js + Better Auth + Neon/Drizzle in a Vercel preview; identity propagation, streaming, cancellation, persistence, cross-user rejection; lint/types/build in CI |
| 2. `/dev` workspace | Pending | Prompt bar, chat panel, mobile tabs, selection context, activity labels, theme; fixture-driven state before live eve |
| 3. Shared-action slice | Pending | One filter (or similar) callable from UI and eve tool; owner-scoped persistence, versions, idempotent retries |
| 4. Grounded explorer | Pending | Bounded repo/docs retrieval with citations; extend OpenUI catalog (text, tables, diagrams) — not a parallel json-render path |
| 5. Adoption proof | Pending | Extension guide against real files; versioned eval set; preview deploy + recovery rehearsal |

**Follow-on** (after the table above): external read-only invocation (ADR 0004), voice via eve (ADR 0002), dependency/video/charts only when a concrete adopter task exists.
