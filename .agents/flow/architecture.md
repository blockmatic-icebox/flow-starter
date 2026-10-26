# Flow Factory architecture

> Canonical inherited technical architecture for Flow Factory. Product applications document deviations in root [ARCHITECTURE.md](../../ARCHITECTURE.md) and [product ADRs](../../docs/adr/). [PRODUCT.md](../../PRODUCT.md) and [DESIGN.md](../../DESIGN.md) are progressively maintained product contracts. Decision rationale: [Factory ADRs](decisions/adr/).

Flow Factory follows the [Agentic Architecture foundation](decisions/adr/0001-agentic-architecture.md): capability-first operations, validated human and agent interfaces, Vercel-aligned infrastructure, and an integrated TypeScript monorepo. This document describes the current technical structure and implementation status. The foundational ADR explains technology selection and trade-offs; historical ADR 0007 and ADR 0008 have been consolidated into it.

## 1. Goals

Flow Factory is an **opinionated Next.js and React** baseline for agentic applications. The application framework is a chosen part of the factory foundation, not an interchangeable option adopters reselect from scratch.

Flow Factory demonstrates how to build **agentic applications** with:

- **Generative UI** that never executes arbitrary model output—only validated OpenUI Lang documents rendered through an allowlisted component catalog.
- **Composition tiers**: controlled intents, declarative multi-section stacks, and optional model-backed open-ended answers.
- **Shared actions** (planned): UI controls and agents call the same authorized server operations; privileged actions are registered by the host, not deserialized from model text.
- **Vercel-aligned defaults**: Next.js App Router, optional AI Gateway for models, preview-friendly builds.
- **Capability-first interfaces:** reusable validated operations for human applications and agent consumers, exposed through HTTP, MCP, or other interfaces only when needed ([PDR 0001](decisions/pdr/0001-agnostic-api-first.md)).

The checkout is a **baseline**, not a finished product. Replace fixtures, routes, and templates; keep `@repo/genui` contracts.

## 2. Repository layout

```text
apps/web/                   # product starter (minimal homepage)
packages/
  genui/                    # @repo/genui — compiler, orchestration, React adapter
  db/                       # @repo/db — Drizzle schema, client, migrations
  ui/                       # design system (shadcn + Base UI)
  ts/                       # shared TypeScript config
.agents/
  eval/                     # Factory evaluation engine (@repo/flow-eval)
  tooling/                  # worktrees, checks, security, setup
  flow/                     # methodology, ADRs, specs (this document)
  skills/                   # first-party Flow skills
docker-compose.yml          # Neon Local proxy (optional local Postgres endpoint)
docs/adr/                   # product ADRs (starter: adoption only)
```

Application split with a separate `apps/flow` demo was removed in [ADR 0014](decisions/adr/0014-web-only-product-application.md). Historical Flow Agent and MCP demo routes lived in `apps/flow` per [ADR 0010](decisions/adr/0010-site-consultant-chat-and-mcp.md) and [ADR 0012](decisions/adr/0012-flow-and-web-applications.md).

Do not import server-only modules from client renderers. Share serializable types and Zod schemas across boundaries.

## React and Next.js application architecture

React code follows [ADR 0009](decisions/adr/0009-react-nextjs-fractal-architecture.md): route-first colocation (route-local by default, optional `_components` / `_lib` grouping, app-shared extraction, then `packages/` only when reuse justifies it), Server Components by default, nuqs for shareable URL state, and no mandatory `features/` layer. Rationale, enforcement, and package boundaries for `apps/web`, `@repo/ui`, and `@repo/genui` belong in that ADR.

## 3. Generative UI: select → compile → validate → render

| Stage | Responsibility |
| --- | --- |
| **Select** | Route the user query to tier 1 (known intent), tier 2 (declarative compound), or tier 3 (open-ended). |
| **Compile** | Parse OpenUI text, enforce component/composite allowlists, validate props with Zod, ground record references. |
| **Validate** | Structural validation finishes before any renderable `partial` or `complete` event is emitted. The browser validates inbound NDJSON again before React sees it. |
| **Render** | `@repo/genui/react` renders only an envelope the compiler accepts. It does not execute model-authored HTML, CSS, JavaScript, or unknown components. |

**Envelope:** `CompositionEnvelope` carries `openuiText`, grounded `records`, and metadata. The client consumes **NDJSON** events (`start`, `partial`, `complete`, `error`) from `POST /api/genui/compose`. A newer submission aborts the previous request and ignores events for older request ids.

**Fixtures:** the demo uses fictional **Acme Analytics** catalog data under `packages/genui/src/fixtures/`. Adopters swap in their own record providers.

**Foundation:** OpenUI Lang. Routes, packages, and extension points: [.agents/flow/specs/genui.md](specs/genui.md). Decision: [ADR 0003](decisions/adr/0003-genui-openui-foundation.md).

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

The registry is not a completed approval workflow or cross-channel authorization system. The adopting product still implements identity, resource ownership, and privileged execution. See [ADR 0011](decisions/adr/0011-api-and-agent-security-boundaries.md) and [.agents/flow/security/security-model.md](security/security-model.md).

## 6. Product application and GenUI integration

`apps/web` is the only product application in this template ([ADR 0014](decisions/adr/0014-web-only-product-application.md)). It ships a minimal starter homepage; it does **not** include a pre-wired GenUI demo route, Flow Agent sidebar, or MCP endpoint. Neutral MCP and agent discoverability for adopters is tracked in [mcp-discoverability.md](initiatives/mcp-discoverability.md) (separate from product assessment overlays).

**GenUI runtime** lives in `@repo/genui` (`packages/genui`). Adopters add compose routes, action registries, and UI under `apps/web` when the product needs generative UI. Integration patterns, security boundaries, and tests are documented in [specs/genui.md](specs/genui.md).

Historical reference implementations (Flow Agent chat, read-only MCP, fixture lab, knowledge snapshot bundling) existed under `apps/flow` before ADR 0014. They are not part of the current checkout layout.

A production product must establish its own domain capabilities, persistence, authentication, authorization, compose/chat/MCP surfaces, and agent actions according to its requirements. Use [the security model](security/security-model.md) and [ADR 0011](decisions/adr/0011-api-and-agent-security-boundaries.md) when exposing public JSON or agent interfaces.

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

Flow Agent chat and read-only MCP were historically implemented in `apps/flow` ([ADR 0010](decisions/adr/0010-site-consultant-chat-and-mcp.md), [ADR 0012](decisions/adr/0012-flow-and-web-applications.md)). Eve workspace voice (ADR 004) and `/dev` placement (ADR 005) apply only when those features are implemented in the product app. Current Factory direction for rediscoverable MCP on the starter: [mcp-discoverability.md](initiatives/mcp-discoverability.md).

### Vercel deployment

Deploy **`web`** as a Vercel project with **Root Directory** `apps/web`, enable **Include source files outside of the Root Directory in the Build Step**, and keep install/build commands in [`apps/web/vercel.json`](../../apps/web/vercel.json).

- **Filtered install** — `pnpm install --frozen-lockfile --filter web...` installs the app and workspace dependencies.
- **Skip unaffected builds** — `turbo query affected --tasks build --packages web --exit-code` in `ignoreCommand` when configured.
- **CI remote cache** — [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) uses Vercel Remote Cache when `TURBO_TEAM` is set.

## 8. Quality and CI

Local gates:

- `pnpm qa` — Flow docs, React architecture boundaries, lint, knip, sherif, types, unit tests, and `drizzle-kit check` for `@repo/db` (no database required). Knip reports unlisted dependencies and unresolved imports. The Next.js TypeScript plugin name in `packages/ts` is an editor plugin, not a package import, so Knip ignores the unresolved name `next` there. Generated shadcn files under `packages/ui/src/components` stay in the catalog even when a demo does not import every component.
- `pnpm hooks:pre-commit` — staged secret-file block, staged secret scan, then checks selected from the staged diff. It does not run Playwright, the production build, or the full test suite.
- `pnpm security:check` — secret-scanner canary, full gitleaks scan, OSV on both lockfiles, and `pnpm audit` (requires gitleaks and osv-scanner; `pnpm setup:full` or the individual setup commands).
- `pnpm ci:local` — `pnpm qa`, documentation and architecture tests, script tests, offline GenUI eval, browser tests, security checks, and the production build.

GitHub Actions: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) and [`.github/workflows/security.yml`](../../.github/workflows/security.yml) run on pull requests and pushes to `main`. Pull request builds use `pull_request` and do not receive deployment or model secrets. [`.github/workflows/pr-title.yml`](../../.github/workflows/pr-title.yml) enforces Conventional Commits on PR titles; [`.github/workflows/commit-messages.yml`](../../.github/workflows/commit-messages.yml) enforces the same subject format on every commit in the PR. Local `pnpm hooks:commit-msg` (via `simple-git-hooks`) blocks non-conventional subjects before a commit is created. DeepSec stays manual in [`.github/workflows/deepsec.yml`](../../.github/workflows/deepsec.yml).

GenUI unit tests and graded prompt matrix: `pnpm --filter @repo/genui test` (`packages/genui/src/eval/query-matrix.ts`, offline: `pnpm eval:genui:offline`). Product browser tests: `pnpm test:browser` (see [GenUI tests](specs/genui.md#tests)). Factory evaluation: `pnpm --dir .agents test` and `pnpm --dir .agents flow-eval:check`.

### Local Neon database

Neon Local is a Docker proxy to a cloud branch (not an offline Postgres engine). Copy `.env.defaults.example` to `.env`, set `NEON_API_KEY` and `NEON_PROJECT_ID`, then `pnpm db:start`, `pnpm db:migrate`, and `pnpm db:ping`. Default URL: `postgres://neon:npg@localhost:5432/neondb?sslmode=require`. The GenUI demo does not connect to the database until adopters wire `@repo/db` into application features.

**Flow eval isolation:** Database-dependent methodology and product evals provision one disposable `flow_eval_<hash>` database per subject through the same Neon Local proxy; the runner holds admin credentials in the Factory checkout only. Subjects receive an isolated `DATABASE_URL` in gitignored worktree `.env.local`. Lifecycle, recovery (`eval recover-databases`), and parallel guarantees are documented in [eval/RUN.md — database isolation](../eval/RUN.md#database-isolation-neon-local). Eval subjects use the shared `neon` role today (no per-subject DB role).

## 9. Adoption path

See [factory.md — Adopting Flow Factory](factory.md#adopting-flow-factory).

## 10. Implementation status

This document describes the current technical baseline and intended system boundaries.

Implemented and planned capabilities must be identified accurately in their relevant architecture sections.

The inherited foundation's mission, goals and capabilities are explained in [.agents/flow/factory.md](factory.md).

Product-specific delivery work can be managed through Flow's existing initiatives, optional plans and specifications when appropriate.

Do not introduce a separate mandatory planning document.

Update the relevant architectural contract when the implementation materially changes.
