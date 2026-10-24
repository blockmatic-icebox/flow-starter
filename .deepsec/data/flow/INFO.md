# Flow

Open-source starter for agentic systems on Vercel, with a planned self-explaining `/dev` workspace. Next.js App Router in `apps/web`, shared shadcn-style UI in `packages/ui`. No Better Auth routes, eve runtime, Neon PostgreSQL/Drizzle app data, `/dev` workspace, or GitHub REST client in the tree yet — root `ARCHITECTURE.md` and `ROADMAP.md` describe planned identity, agent, canvas, and grounding boundaries.

## What this codebase does

Turborepo with TypeScript, Ultracite (Oxlint/Oxfmt), and Tailwind. `apps/web` is a Next.js starter (home page, theme toggle). `packages/ui` exports React components for the web app. Product behavior and UX live in `PRODUCT.md` and `DESIGN.md`.

## Auth shape (planned, not implemented)

Better Auth with GitHub OAuth only, per `ARCHITECTURE.md` §4. When auth lands, flag missing session checks on server actions and route handlers, cross-user access to chats/canvases without owner scoping, and any anonymous fallback on private routes or agent streams.

## Threat model (current + planned)

Today: mostly static UI and shared components — focus on unsafe `dangerouslySetInnerHTML`, secrets in client bundles or logs, and trusting unvalidated URL/query state. Planned (documented, not necessarily in code): untrusted documentation and external API responses as model input, SSRF on approved-host fetches with strict allowlists, CSRF on cookie-authenticated mutations, rate limits on agent and tool endpoints, oversized canvas specs and datasets.

## Project-specific patterns to flag

- Next.js `app/` route handlers and Server Actions that mutate data without authz (once auth exists).
- Client components that embed model keys, DB URLs, or OAuth secrets.
- `packages/ui` primitives used with unsanitized user HTML (markdown/code highlighting paths in `apps/web`).
- eve tools or HTTP adapters that bypass authorization on operations the UI and the agent share.

- Voice credential issuance without the same GitHub session and `/dev` access policy; permanent voice provider credentials exposed to clients.
- External coding-agent credentials that can mutate browser canvases despite their read-only scope.
- Voice delegation or transcript replay that duplicates an eve turn or applies an action the person did not confirm.

## Known false-positives

- Starter home page in `apps/web` with no production auth or agent surface yet.
- Generated or vendor UI under `packages/ui/src/components/**` (shadcn-style); still review custom glue in `apps/web`.
- `.env*` templates if present — not live secrets.
- Build output (`.next/`, `dist/`) — excluded via `config.json` ignore paths.
