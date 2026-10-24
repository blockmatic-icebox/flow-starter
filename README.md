# Flow Starter

An AI-first monorepo starter: generative UI (**select → compile → render**), shared action boundaries, and Vercel-friendly defaults. [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) are **templates**—replace them with your product. System shape is in [ARCHITECTURE.md](ARCHITECTURE.md); delivery order in [ROADMAP.md](ROADMAP.md). Decisions live in [docs/adr/](docs/adr/).

## Quick start

Prerequisites: Node.js 24+, [pnpm](https://pnpm.io/) 12+.

```sh
pnpm install
pnpm dev
```

Open the demo at `/genui-demo` (local URL from the dev server, or `https://flow.localhost` after [Portless setup](#local-https-portless)).

| Command            | Purpose                                       |
| ------------------ | --------------------------------------------- |
| `pnpm dev`         | Development (Turborepo)                       |
| `pnpm build`       | Production build                              |
| `pnpm lint`        | oxlint + oxfmt                                |
| `pnpm check-types` | TypeScript                                    |
| `pnpm test`        | `@repo/genui` unit tests                      |
| `pnpm qa`          | lint:fix + types + test (pre-commit)          |
| `pnpm ci:local`    | same steps as GitHub Actions (includes build) |

Optional tier-3 model answers: set `AI_GATEWAY_API_KEY` (and optionally `GENUI_MODEL`) in `apps/web/.env.local`. See [docs/adr/002-vercel-ai-sdk-for-tier-3.md](docs/adr/002-vercel-ai-sdk-for-tier-3.md). Compose rate limits: off on `flow.localhost` by default; set `GENUI_ENFORCE_RATE_LIMIT=1` to test 429 behavior locally.

## Packages

| Package | Role |
| --- | --- |
| `apps/web` | Next.js app (`/`, `/genui-demo`, `POST /api/genui/compose`) |
| `packages/genui` | OpenUI compiler, orchestration, React renderer |
| `packages/ui` | Shared shadcn + Base UI components |

## Git hooks

After `pnpm install`, `prepare` installs [simple-git-hooks](https://github.com/toplenboren/simple-git-hooks). Pre-commit runs `pnpm qa` and re-stages formatter fixes (`git update-index --again`).

## CI

Local (matches [`.github/workflows/ci.yml`](.github/workflows/ci.yml)): `pnpm ci:local` (not `pnpm ci` — that is pnpm’s frozen install).

Remote manual run after push: `gh workflow run CI` or `gh workflow run "GenUI quality"`. Local Actions runner: [act](https://github.com/nektos/act) with `act workflow_dispatch -W .github/workflows/ci.yml` (requires Docker).

## Local HTTPS (Portless)

```sh
pnpm setup:portless   # once
pnpm dev
```

Details: bypass with `pnpm --filter web dev:app`, or `PORTLESS=0 pnpm --filter web dev`.

## Further reading

- [ARCHITECTURE.md](ARCHITECTURE.md) — data flow and GenUI tiers
- [ROADMAP.md](ROADMAP.md) — delivery order (detail in ARCHITECTURE §10)
- [docs/specs/genui/README.md](docs/specs/genui/README.md) — package layout and demo API
- [AGENTS.md](AGENTS.md) — agent editing rules for this repo
