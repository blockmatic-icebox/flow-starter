# Flow application (`flow-app`)

Flow methodology experience: Generative UI at `/`, Flow Agent sidebar, fixture lab, and compose/chat/MCP APIs.

- Agent implementation: `app/_lib/flow-agent/` (instructions, tools, bundled knowledge).
- Route-local code stays under `app/`; extract only when reuse justifies it.
- Regenerate `knowledge-snapshot.ts` via `node scripts/bundle-knowledge.mjs` (runs on `build`).
- Local hostname: `flow.localhost` (Portless).

Root `AGENTS.md` and `ARCHITECTURE.md` own monorepo-wide rules.
