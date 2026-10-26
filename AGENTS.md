# Agents

Short pointers for coding agents on branch **`simple`**.

## Current truth

| Document | Use |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | Agentic MCP/API-first starter scope |
| [DESIGN.md](DESIGN.md) | Default shadcn studio layout |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Packages, commands, env, MCP/GenUI boundaries |
| [docs/adr/0001-use-flow-factory.md](docs/adr/0001-use-flow-factory.md) | Factory adoption |
| [docs/specs/001-lean-agentic-starter.md](docs/specs/001-lean-agentic-starter.md) | Starter requirements |

**Tracked work:** GitHub Issues (see [docs/simplified-flow-prd.md](docs/simplified-flow-prd.md)). No mandatory Flow phase router or custom Flow skill load for ordinary edits.

**Matt workflow:** Install and invoke skills per [README — Matt Pocock workflow](README.md#matt-pocock-workflow). Use native skill conventions; verify files on disk after `pnpm --dir .agents skills:install`.

## Product code

- `apps/web` — Next.js studio, MCP, GenUI API
- `packages/genui`, `packages/ui`, `packages/db`
- `agent/` — Eve tools (not duplicated business logic outside `@repo/genui`)

Factory stack ADRs live under `.agents/flow/decisions/` when touching inherited boundaries.

## Verification

Run checks that match the change; report commands and exit codes. UI changes: browser smoke via `pnpm test:browser` when routes change.

Optional Factory parity (Flow docs, eval harness, agents tooling): `pnpm ci:factory:local` or `pnpm --dir .agents check:factory`.
