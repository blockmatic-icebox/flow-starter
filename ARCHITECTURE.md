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
apps/web/                   # product starter (minimal homepage)
apps/flow/                  # Flow experience (GenUI at /, Flow Agent, APIs)
packages/
  genui/                    # @repo/genui — compiler, orchestration, React adapter
  db/                       # @repo/db — Drizzle schema, client, migrations
  ui/                       # design system (shadcn + Base UI)
  ts/                       # shared TypeScript config
docker-compose.yml          # Neon Local proxy (optional local Postgres endpoint)
docs/
  adr/                      # architecture decision records
  pdr/                      # product decision records
  specs/genui.md            # GenUI technical specification
```

Do not import server-only modules from client renderers. Share serializable types and Zod schemas across boundaries.

## React and Next.js application architecture

React code follows [ADR 0009](docs/adr/0009-react-nextjs-fractal-architecture.md): route-first colocation (route-local by default, optional `_components` / `_lib` grouping, app-shared extraction, then `packages/` only when reuse justifies it), Server Components by default, nuqs for shareable URL state, and no mandatory `features/` layer. Rationale, enforcement, and package boundaries for `apps/web`, `apps/flow`, `@repo/ui`, and `@repo/genui` belong in that ADR.

## 3. Generative UI: select → compile → validate → render

| Stage | Responsibility |
| --- | --- |
| **Select** | Route the user query to tier 1 (known intent), tier 2 (declarative compound), or tier 3 (open-ended). |
| **Compile** | Parse OpenUI text, enforce component/composite allowlists, validate props with Zod, ground record references. |
| **Validate** | Structural validation finishes before any renderable `partial` or `complete` event is emitted. The browser validates inbound NDJSON again before React sees it. |
| **Render** | `@repo/genui/react` renders only an envelope the compiler accepts. It does not execute model-authored HTML, CSS, JavaScript, or unknown components. |

**Envelope:** `CompositionEnvelope` carries `openuiText`, grounded `records`, and metadata. The client consumes **NDJSON** events (`start`, `partial`, `complete`, `error`) from `POST /api/genui/compose`. A newer submission aborts the previous request and ignores events for older request ids.

**Fixtures:** the demo uses fictional **Acme Analytics** catalog data under `packages/genui/src/fixtures/`. Adopters swap in their own record providers.

**Foundation:** OpenUI Lang. Routes, packages, and extension points: [docs/specs/genui.md](docs/specs/genui.md). Decision: [ADR 0003](docs/adr/0003-genui-openui-foundation.md).

## 4. Composition tiers

| Tier | Name | Mechanism |
| --- | --- | --- |
| 1 | Controlled | Deterministic intent routing → single experience (e.g. comparison, collection, status). |
| 2 | Declarative | Keyword-driven **SectionStack** of approved child expressions. |
| 3 | Open-ended answer | Optional AI Gateway-backed prose inside a validated Answer experience; grounded fallback without credentials. Does not generate arbitrary component trees. |

Tier 1–2 paths are fully testable without network access. Tier 3 is optional (ADR 002).

## 5. Actions and security

- **Registered actions** live in a host-owned registry (`createActionRegistry`). Kinds include navigate, filter, sort, server-tool, etc.
- Each registration carries an `ActionSecurityPolicy` (`requiresAuth`, `requiresApproval`). Callers and model output cannot supply those flags. An invocation only names an action id and input.
- Model output **does not** define privileged actions. Validation checks the registry, the input schema, and the trusted policy. Execution stays separate from validation.
- Compose and render paths treat external text as untrusted: injection patterns route to safe **Answer** or **Status** experiences.

The registry is not a completed approval workflow or cross-channel authorization system. The adopting product still implements identity, resource ownership, and privileged execution. See [ADR 0011](docs/adr/0011-api-and-agent-security-boundaries.md) and [docs/security/security-model.md](docs/security/security-model.md).

## 6. Implemented Flow application surfaces

The current demo APIs belong to `apps/flow`, not `apps/web`.

The product-neutral `apps/web` application does not ship the Flow Agent, GenUI demo routes, or MCP endpoint.

| Surface | Method | Responsibility |
| --- | --- | --- |
| `/` | GET | Flow GenUI experience and Flow Agent shell |
| `/api/genui/compose` | POST | Validated GenUI composition over NDJSON streaming |
| `/api/chat` | POST | Flow Agent conversation using AI SDK UI streams |
| `/api/mcp` | GET, POST, DELETE, OPTIONS | Read-only Flow Agent MCP endpoint with access controls |
| `/genui-lab/fixtures/[fixtureId]` | GET | GenUI fixture inspection and browser regression coverage |

These paths are relative to the `apps/flow` application's origin.

The principal implementations are:

- `apps/flow/app/page.tsx`
- `apps/flow/app/api/genui/compose/route.ts`
- `apps/flow/app/api/chat/route.ts`
- `apps/flow/app/api/mcp/route.ts`
- `apps/flow/app/_lib/flow-agent/`
- `apps/flow/app/_lib/genui/`
- `apps/flow/app/_lib/security/`

The GenUI experience is served at the Flow application's root path. There is no current `/genui-demo` route.

The chat implementation uses approved Flow knowledge tools and can call an AI Gateway-backed model when configured. A deterministic fallback is available without model credentials.

MCP uses the official MCP SDK and exposes four approved read-only tools:

- `describe_architecture`
- `describe_technologies`
- `describe_capabilities`
- `describe_workflow`

The chat tool registry additionally supports bounded knowledge access and host-controlled interface actions. These additional chat capabilities must not be confused with the externally exposed MCP tool list.

The Flow Agent knowledge snapshot is generated from approved repository documentation by `apps/flow/scripts/bundle-knowledge.mjs`. The generated file is `apps/flow/app/_lib/flow-agent/knowledge-snapshot.ts`.

### Input and execution boundaries

Public JSON routes use the bounded reader in `apps/flow/app/_lib/security/read-json-request.ts`.

Compose accepts a bounded `{ query, clientRequestId?, version? }` request and streams validated composition events.

The chat route validates the AI SDK message envelope, limits execution, and does not expose raw model reasoning.

GenUI output is compiled and validated before reaching the React rendering layer. Model output cannot register privileged actions or bypass host-owned authorization policies.

Rate-limit admission is implemented for chat and composition. Production requires the configured persistent rate-limit store and fails closed when the required store is unavailable.

MCP production access requires the configured application origin and approved bearer-token or explicitly enabled public read-only mode. Origin checking is not authentication.

The database layer preserves TLS verification and applies the documented local-development restrictions.

For authoritative security requirements and detailed implementation limits, use [the security model](docs/security/security-model.md) and [ADR 0011](docs/adr/0011-api-and-agent-security-boundaries.md).

### Important limitations

The implemented Flow Agent is not the planned full Eve-based product agent runtime.

The read-only MCP server is not a complete authenticated business-action layer.

The product app has no inherited requirement to render a chat sidebar.

A production product must establish its own domain capabilities, persistence, authentication, authorization, and agent actions according to its actual requirements.

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

Flow Agent chat and read-only MCP are implemented in `apps/flow`, following the historical integration decision in [ADR 0010](docs/adr/0010-site-consultant-chat-and-mcp.md) and the current application split in [ADR 0012](docs/adr/0012-flow-and-web-applications.md). Eve workspace voice (ADR 004) and `/dev` placement (ADR 005) apply only when those features are implemented.

## 8. Quality and CI

Local gates:

- `pnpm qa` — Flow docs, React architecture boundaries, lint, knip, sherif, types, unit tests, and `drizzle-kit check` for `@repo/db` (no database required). Knip reports unlisted dependencies and unresolved imports. The Next.js TypeScript plugin name in `packages/ts` is an editor plugin, not a package import, so Knip ignores the unresolved name `next` there. Generated shadcn files under `packages/ui/src/components` stay in the catalog even when a demo does not import every component.
- `pnpm hooks:pre-commit` — staged secret-file block, staged secret scan, then checks selected from the staged diff. It does not run Playwright, the production build, or the full test suite.
- `pnpm security:check` — secret-scanner canary, full gitleaks scan, OSV on both lockfiles, and `pnpm audit` (requires gitleaks and osv-scanner; `pnpm setup:full` or the individual setup commands).
- `pnpm ci:local` — `pnpm qa`, documentation and architecture tests, script tests, offline GenUI eval, browser tests, security checks, and the production build.

GitHub Actions: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) and [`.github/workflows/security.yml`](.github/workflows/security.yml) run on pull requests and pushes to `main`. Pull request builds use `pull_request` and do not receive deployment or model secrets. [`.github/workflows/pr-title.yml`](.github/workflows/pr-title.yml) enforces Conventional Commits on PR titles. DeepSec stays manual in [`.github/workflows/deepsec.yml`](.github/workflows/deepsec.yml).

GenUI unit tests and graded prompt matrix: `pnpm --filter @repo/genui test` (`packages/genui/src/eval/query-matrix.ts`, offline: `pnpm eval:genui:offline`). Flow Agent MCP protocol tests: `pnpm --filter flow-app test`. Browser fixture lab and shell smokes: `pnpm test:browser` (see [docs/specs/genui.md](docs/specs/genui.md#tests)).

### Local Neon database

Neon Local is a Docker proxy to a cloud branch (not an offline Postgres engine). Copy `.env.defaults.example` to `.env`, set `NEON_API_KEY` and `NEON_PROJECT_ID`, then `pnpm db:start`, `pnpm db:migrate`, and `pnpm db:ping`. Default URL: `postgres://neon:npg@localhost:5432/neondb?sslmode=require`. The GenUI demo does not connect to the database until adopters wire `@repo/db` into application features.

## 9. Adoption path

See [docs/readme.md — Adopting Flow Starter](docs/readme.md#adopting-flow-starter).

## 10. Implementation status

This document describes the current technical baseline and intended system boundaries.

Implemented and planned capabilities must be identified accurately in their relevant architecture sections.

The inherited foundation's mission, goals and capabilities are explained in [docs/readme.md](docs/readme.md).

Product-specific delivery work can be managed through Flow's existing initiatives, optional plans and specifications when appropriate.

Do not introduce a separate mandatory planning document.

Update the relevant architectural contract when the implementation materially changes.
