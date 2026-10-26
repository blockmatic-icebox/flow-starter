# Architecture

> Product technical contract. [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md). Adoption: [ADR 0001](docs/adr/0001-use-flow-factory.md). Starter spec: [001](docs/specs/001-lean-agentic-starter.md).

## System overview

```text
┌─────────────────┐     POST /api/genui/compose      ┌──────────────┐
│   apps/web      │ ───────────────────────────────► │ @repo/genui  │
│   studio + MCP  │ ◄── OpenUI envelope + records ── │  compose     │
└────────┬────────┘                                  └──────┬───────┘
         │                                                   │
         │  MCP compose_ui                                   ▼
         ├──────────────────────────────────────────► @repo/ui (render)
         │
┌────────┴────────┐
│ agent/ (eve)    │  compose-ui, list-component-catalog → @repo/genui
└─────────────────┘

Optional: @repo/db (app_meta + Better Auth scaffold) when DATABASE_URL is set
```

## Components

| Path | Role |
| --- | --- |
| `apps/web` | Next.js app — studio UI, `/api/mcp`, `/api/genui/compose`, `/api/chat`, discovery routes |
| `packages/genui` | OpenUI Lang orchestration, validation, React renderer |
| `packages/ui` | shadcn component library and global CSS |
| `packages/db` | Drizzle schema and migrations (blank product schema) |
| `agent/` | Eve root agent and tools |
| `apps/web/mcp-app/` | Single-file MCP App bundle (`genui-preview.html`) |

## APIs and agent surfaces

| Surface | Notes |
| --- | --- |
| `POST /api/genui/compose` | NDJSON stream; no database |
| `POST /api/mcp` | Streamable HTTP; tools `compose_ui`, `list_component_catalog`, `health` |
| `POST /api/chat` | Optional Anthropic sidebar chat (`ANTHROPIC_API_KEY`) |
| `llms.txt`, `.well-known/mcp/*`, `/openapi.json` | Agent discovery |

## Database

Migrations: `0000_app_meta`, `0001_better_auth_core` only. No product tables on `simple`.

```bash
pnpm db:migrate    # when DATABASE_URL is set
pnpm --filter @repo/db db:check
```

**Vercel:** [`apps/web/scripts/vercel-build.mjs`](apps/web/scripts/vercel-build.mjs) runs `pnpm db:migrate` when `DATABASE_URL` is present; no seed step.

## Environment

| Variable             | Purpose                               |
| -------------------- | ------------------------------------- |
| `AI_GATEWAY_API_KEY` | Open-ended OpenUI generation (tier 3) |
| `ANTHROPIC_API_KEY`  | Optional `/api/chat`                  |
| `DATABASE_URL`       | Optional Postgres for future features |
| `GENUI_MODEL`        | Override gateway model for compose    |
| `AGENTIC_CHECK_URL`  | Host passed to `pnpm agentic:check`   |

## Commands

```bash
pnpm setup
pnpm dev                 # https://app.localhost (portless)
pnpm qa
pnpm test
pnpm exec eve eval smoke
pnpm agentic:check
pnpm build:web
pnpm test:browser
```

## GenUI routing

`@repo/genui` uses deterministic regex intents for tier-1 templates (support dashboard, plan comparison, onboarding form), declarative tier-2 stacks, and AI Gateway tier-3 open composition or refinement. **Jev is not wired on `simple`** — tier selection uses `tierFromSignals` in `packages/genui/src/core/tiers.ts` until ambiguous routing justifies a classifier.

## Eve

Repo root `agent/` with `withEve` in [`apps/web/next.config.ts`](apps/web/next.config.ts). Smoke eval: [`evals/smoke/compose-support-dashboard.eval.ts`](evals/smoke/compose-support-dashboard.eval.ts).
