# Product application (`apps/web`)

Next.js studio: prompt + sidebar chat + GenUI preview. MCP at `/api/mcp`, compose at `/api/genui/compose`. Eve root agent at repo `agent/`.

- Colocate route code under `app/<route>/`.
- Shared UI from `@repo/ui`; GenUI from `@repo/genui`.
- Local hostname: `app.localhost` (portless).

Root [AGENTS.md](../../AGENTS.md) and [ARCHITECTURE.md](../../ARCHITECTURE.md) own monorepo-wide rules.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
