# Flow Starter — agentic application shell

Web application built with Flow Factory. MCP-first and API-first web starter: GenUI (OpenUI Lang + shadcn), Eve agent tools, and is-agentic discovery surfaces. Branch **`simple`** — see [docs/specs/001-lean-agentic-starter.md](docs/specs/001-lean-agentic-starter.md).

## Setup

Requires Node.js 24+ and pnpm 12+.

```bash
pnpm setup
cp .env.defaults.example .env   # optional keys below
pnpm dev                        # https://app.localhost (portless) or pnpm --filter web dev:app --port 3000
```

| Variable             | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `AI_GATEWAY_API_KEY` | Open-ended UI generation                        |
| `ANTHROPIC_API_KEY`  | Optional sidebar chat API                       |
| `DATABASE_URL`       | Optional — runs migrations on Vercel build only |

```bash
pnpm qa
pnpm test:browser
pnpm exec eve eval smoke
pnpm agentic:check
```

## Matt Pocock workflow (optional)

Install skills when you want structured discovery → spec → tickets → implement. See [docs/simplified-flow-prd.md](docs/simplified-flow-prd.md). **GitHub Issues** are the canonical multi-session tracker; root contracts stay in `PRODUCT.md`, `DESIGN.md`, and `ARCHITECTURE.md`.

## Docs

- [PRODUCT.md](PRODUCT.md) · [DESIGN.md](DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md)
- [ADR 0001 — Use Flow Factory](docs/adr/0001-use-flow-factory.md)
- [AGENTS.md](AGENTS.md) — short pointers for coding agents
