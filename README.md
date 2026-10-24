# Flow Starter

An AI-first monorepo starter: generative UI (**select → compile → render**), shared action boundaries, and Vercel-friendly defaults. [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) are **templates**—replace them with your product. System shape is in [ARCHITECTURE.md](ARCHITECTURE.md); delivery order in [ROADMAP.md](ROADMAP.md). Decisions live in [docs/adr/](docs/adr/).

## Quick start

Prerequisites: Node.js 24+, [pnpm](https://pnpm.io/) 12+.

```sh
pnpm install
pnpm dev
```

Open the demo at `/genui-demo` (local URL from the dev server, or `https://flow.localhost` after [Portless setup](#local-https-portless)).

| Command            | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `pnpm dev`         | Development (Turborepo)                                 |
| `pnpm build`       | Production build                                        |
| `pnpm lint`        | oxlint + oxfmt                                          |
| `pnpm check-types` | TypeScript                                              |
| `pnpm test`        | `@repo/genui` unit tests                                |
| `pnpm flow:check`  | Flow documentation path and naming validation           |
| `pnpm flow:test`   | Unit tests for Flow documentation validation            |
| `pnpm qa`          | Non-mutating Flow, lint, type, and test checks          |
| `pnpm ci:local`    | Full local CI including Flow tests and production build |

Optional tier-3 model answers: set `AI_GATEWAY_API_KEY` (and optionally `GENUI_MODEL`) in `apps/web/.env.local`. See [docs/adr/002-vercel-ai-sdk-for-tier-3.md](docs/adr/002-vercel-ai-sdk-for-tier-3.md). Compose rate limits: off on `flow.localhost` by default; set `GENUI_ENFORCE_RATE_LIMIT=1` to test 429 behavior locally.

## Flow workflow

This starter includes [Flow](FLOW.md), a lightweight workflow for product discovery and software delivery:

**Explore → Specify → Plan → Build → Review → Ship**

Flow defines documentation ownership and conventions while installed third-party skills provide specialized product, design, and engineering techniques.

`AGENTS.md` is the compact router for coding agents. `FLOW.md` is the workflow contract. Read only the relevant project documents for a task.

### Project skills

Install or restore project skills after dependencies are installed:

```sh
pnpm skills:install
```

List the installed skills:

```sh
pnpm exec skills list
```

Update the installed skills deliberately:

```sh
pnpm skills:update
```

Skill sources and installed versions are recorded by `skills-lock.json`. The starter uses selected skills from Addy Osmani, Matt Pocock, and ProductSkills. Flow Skills itself is still developing its own reusable skills.

### Working on a feature

Ask your coding agent naturally, for example:

- "Help me explore this product idea and identify its riskiest assumptions."
- "Refine this feature's scope and acceptance criteria."
- "Plan the smallest implementation slice for this capability."
- "Implement this agreed scope and run the appropriate tests."
- "Review this change against the specification and architecture."

For larger work, the agent should use a bounded initiative document under `docs/initiatives/`. Routine small changes do not need additional planning documents.

Root `PRODUCT.md`, `DESIGN.md`, and `ARCHITECTURE.md` remain the current source of truth for their respective concerns. Flow defines canonical output locations for external skills. The repository validator checks documentation naming and decision-number collisions, while human and agent review remain necessary to verify content and intent.

### Documentation validation

Run:

```sh
pnpm flow:check
```

The check is part of `pnpm qa` and `pnpm ci:local`, and runs in the existing manual CI workflow.

`pnpm flow:test` tests the validator itself, including legacy numbering collisions and invalid filenames.

The validator checks document paths and filenames; it does not replace engineering review, verify product decisions, or guarantee skill execution.

## Packages

| Package | Role |
| --- | --- |
| `apps/web` | Next.js app (`/`, `/genui-demo`, `POST /api/genui/compose`) |
| `packages/genui` | OpenUI compiler, orchestration, React renderer |
| `packages/ui` | Shared shadcn + Base UI components |

## Git hooks

After `pnpm install`, `prepare` installs `simple-git-hooks`. Pre-commit runs the non-mutating `pnpm qa` checks. Hooks do not automatically format or stage files.

Run `pnpm lint:fix` deliberately before staging changes that need formatting.

## CI

Local (matches [`.github/workflows/ci.yml`](.github/workflows/ci.yml)): `pnpm ci:local` (not `pnpm ci` — that is pnpm’s frozen install).

Remote manual run after push: `gh workflow run CI` or `gh workflow run "GenUI quality"`. Local Actions runner: [act](https://github.com/nektos/act) with `act workflow_dispatch -W .github/workflows/ci.yml` (requires Docker).

## Local HTTPS (Portless)

```sh
pnpm setup:portless   # once
pnpm dev
```

Details: bypass with `pnpm --filter web dev:app`, or `PORTLESS=0 pnpm --filter web dev`.

## Browser development

UI, layout, and interaction changes must be verified in a running application when browser access is available.

1. Run `pnpm dev` for the normal local development environment, or `pnpm --filter web dev:app` to bypass Portless.
2. Open the relevant route. The bundled GenUI example is at `/genui-demo`.
3. Verify the intended interaction, loading state, empty or error states as applicable, and relevant responsive layouts.
4. Check keyboard accessibility and visible focus where controls are changed.
5. Check the browser console for runtime errors.
6. Run relevant automated tests and report what was verified in the browser separately from test-suite results.

If browser access is unavailable, report that limitation. Do not claim visual verification from typechecking or unit tests alone.

Do not make any product-specific example mandatory.

## Further reading

- [ARCHITECTURE.md](ARCHITECTURE.md) — data flow and GenUI tiers
- [ROADMAP.md](ROADMAP.md) — canonical delivery milestones and status
- [docs/specs/genui/README.md](docs/specs/genui/README.md) — GenUI implementation and historical extraction notes
- [AGENTS.md](AGENTS.md) — agent editing rules for this repo
