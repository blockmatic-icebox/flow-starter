# Flow application (`flow-app`)

Flow methodology experience: Generative UI at `/`, Flow Agent sidebar, fixture lab, and compose/chat/MCP APIs.

- Agent implementation: `app/_lib/flow-agent/` (instructions, tools, bundled knowledge).
- Route-local code stays under `app/`; extract only when reuse justifies it.
- Regenerate `knowledge-snapshot.ts` via `node scripts/bundle-knowledge.mjs` (runs on `build`).
- Local hostname: `flow.localhost` (Portless).

Root `AGENTS.md` and `ARCHITECTURE.md` own monorepo-wide rules.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
