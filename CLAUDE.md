# Project Rules

## Prompt Logging

Every time you receive a new instruction or prompt, append it to `prompts.txt` in the project root with a timestamp (ISO 8601) and a brief summary of what you did in response. Create the file if it doesn't exist. Keep this log updated throughout all sessions.

---

# Feature Intelligence System (assessment build)

AI-first feature request intake, discovery, support, and triage for `apps/web`.

## Architecture

- **App:** `apps/web` (Next.js App Router, route-first colocation under `app/features/`).
- **Data:** JSON file repository (`app/_lib/features/repository.ts`) seeded from `data/feature-requests.seed.json`. Chosen for a one-hour bounded build without a configured `DATABASE_URL`; Postgres via `@repo/db` remains the long-term target per ADR 0001.
- **AI triage:** `POST /api/features/triage` uses Vercel AI SDK `generateObject` when `AI_GATEWAY_API_KEY` is set; otherwise deterministic **fixture mode** (labeled in the response).
- **Human judgment:** Suggested theme, priority, and related requests require explicit **Confirm triage** (server action) before status moves to `triaged`.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| File store vs Postgres | Works offline; fast to ship | No multi-instance consistency |
| Fixture triage fallback | Verifiable without credentials | Not representative of live model quality |
| Anonymous support (cookie visitor id) | No auth setup in session | Weak identity; duplicate risk mitigated per visitor |

## Success metrics (proposed)

1. **Time-to-triage:** median minutes from submit to confirmed triage (human step included).
2. **Duplicate merge rate:** % of new requests confirmed as related to an existing theme within 7 days.
3. **Support signal quality:** support actions per unique visitor vs raw page views on detail pages.

## Local commands

```bash
pnpm dev:web          # http://web.localhost (portless)
pnpm --filter web test
pnpm --filter web test:browser
pnpm --filter web build
```

## AI verification

Live model calls require `AI_GATEWAY_API_KEY` in `apps/web/.env.local`. Without it, triage runs in fixture mode only.
