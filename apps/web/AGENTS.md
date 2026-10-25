# Product application (`apps/web`)

Minimal Next.js product app. **Feature Intelligence** human UI + **ask-only** `/chat` (no mutation tools). **eve** root agent lives at repo `agent/` (not in-app agent sidebar). No GenUI demo unless the product needs it.

**FI MVP testing:** Manual browser verification only — do not add Playwright specs under `tests/browser/` for feature-intelligence routes. See [docs/specs/feature-intelligence-testing.md](../../docs/specs/feature-intelligence-testing.md).

- Colocate route code under `app/<route>/` (see ADR 0009).
- Shared UI from `@repo/ui`; optional database via `@repo/db`.
- Local hostname: `meta-cto.localhost` (Portless).

Root `AGENTS.md` and `ARCHITECTURE.md` own monorepo-wide rules.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
