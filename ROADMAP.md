# Roadmap

High-level delivery order for Flow Starter. **Status and acceptance criteria** for each step live in [ARCHITECTURE.md](ARCHITECTURE.md) §10 (implementation sequence).

## Now (shipped)

- `@repo/genui` — OpenUI Lang compiler, composition tiers, React adapter, Acme fixtures
- `POST /api/genui/compose` — NDJSON stream with optional per-IP rate limiting
- `/genui-demo` — integration example
- CI workflows (local parity; remote triggers disabled until enabled)

## Next

1. **Foundation spike** — eve, Better Auth, Neon/Drizzle; identity on compose and agent paths
2. **`/dev` workspace** — prompt bar, chat, canvas shell, selection context
3. **Shared-action slice** — one filter (or similar) from UI and eve tools
4. **Grounded explorer** — bounded retrieval with citations; extend OpenUI catalog
5. **Adoption proof** — extension guide, eval set, preview deploy rehearsal

## Later

- External read-only invocation ([ADR 006](docs/adr/006-external-invocation-is-read-only.md))
- Voice via eve ([ADR 004](docs/adr/004-voice-delegates-to-eve.md))
- Browser/MCP Apps quality harness (Playwright, offline evals) — see gaboesquivel.com `genui-quality` workflow as reference

Decisions: [docs/adr/](docs/adr/). Product and design templates: [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md).
