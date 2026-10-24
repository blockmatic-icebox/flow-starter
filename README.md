# Flow Starter

Flow Starter is an opinionated **Next.js and React** starter for building agentic products. It supplies the application architecture, workflow, shared UI, GenUI contracts, verification tooling, and agent documentation conventions. Adopters focus on their own product rather than repeatedly selecting and assembling the foundation.

Generative UI follows **select → compile → render**, with shared action boundaries and Vercel-friendly defaults. [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) are **templates**—replace them with your product. System shape is in [ARCHITECTURE.md](ARCHITECTURE.md); delivery order in [ROADMAP.md](ROADMAP.md). Decisions live in [docs/adr/](docs/adr/).

Flow Starter follows the [Agentic Architecture foundation](docs/adr/0001-agentic-architecture.md) and a [product-agnostic, capability-first and agent-ready approach](docs/pdr/0001-agnostic-api-first.md). The application and GenUI demonstration are implemented; identity, persistence, a full agent workspace, and MCP host integration are planned rather than shipped.

## Quick start

Prerequisites: Node.js 24+, [pnpm](https://pnpm.io/) 12+.

```sh
pnpm install
pnpm dev
```

Open the demo at `/genui-demo` (local URL from the dev server, or `https://flow.localhost` after [Portless setup](#local-https-portless)).

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development (Turborepo) |
| `pnpm build` | Production build |
| `pnpm lint` | oxlint + oxfmt |
| `pnpm check-types` | TypeScript |
| `pnpm test` | `@repo/genui` unit tests |
| `pnpm flow:check` | Flow documentation path and naming validation |
| `pnpm flow:test` | Unit tests for Flow documentation validation |
| `pnpm architecture:check` | Objective React monorepo boundary validation |
| `pnpm architecture:test` | Unit tests for architecture boundary validation |
| `pnpm qa` | Non-mutating Flow, architecture, lint, type, and tests |
| `pnpm ci:local` | Full local CI including architecture checks and build |
| `pnpm mcp:next` | Next.js DevTools MCP bridge (dev server must be running) |

Optional tier-3 model answers: set `AI_GATEWAY_API_KEY` (and optionally `GENUI_MODEL`) in `apps/web/.env.local`. See [docs/adr/002-vercel-ai-sdk-for-tier-3.md](docs/adr/002-vercel-ai-sdk-for-tier-3.md). Tier-3 model responses in this starter are general, non-source-grounded answers. They must not display fixture document references as citations. Verified catalog sources are attached only when the response is supported by those records. Compose rate limits: off on `flow.localhost` by default; set `GENUI_ENFORCE_RATE_LIMIT=1` to test 429 behavior locally.

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

Technical skills complement Flow's methodology skills. The collection covers implemented technologies (including `nextjs`, `next-dev-loop`, `react`, `nuqs`, `shadcn`, and browser verification skills) and selected future integrations. Choose the smallest relevant skill set for each task; do not load all skills by default. When a skill conflicts with installed Next.js 16 documentation under `node_modules/next/dist/docs/`, trust the installed framework docs. Installed skills provide implementation guidance, not permission to change the architecture, add dependencies, or deploy services.

`skills-lock.json` is the reproducible source manifest. Local agent-specific installation directories are not part of the shared repository contract. The starter remains coding-agent agnostic.

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

## Next.js runtime verification for agents

React and Next.js work is not complete when code merely compiles. Use proportional verification:

1. Inspect the affected feature and relevant architecture contracts ([ADR 0009](docs/adr/0009-react-nextjs-fractal-architecture.md) for UI and routes).
2. Read the version-matched Next.js documentation bundled with the installed framework.
3. Start the development server (`pnpm dev` or `pnpm --filter web dev:app`; Portless may change the URL).
4. Connect through **Next.js DevTools MCP** when available: run `pnpm mcp:next` in a compatible MCP client while the dev server is running. This is **development diagnostics**, not the application's product MCP surface.
5. Query runtime errors, routes, and logs through the bridge; do not expose `/_next/mcp` as a production feature.
6. Verify user-visible behavior in a browser (or browser automation) for UI changes.
7. Run `pnpm architecture:check`, typechecking, tests, and relevant builds.
8. Report actual results and any verification that was unavailable.

Application MCP tools for product capabilities remain separate from Next.js development introspection.

## Architectural decisions

- [ADR 0001 — Agentic Architecture](docs/adr/0001-agentic-architecture.md): foundational technology choices and rationale.
- [ADR 0009 — React and Next.js Fractal Architecture](docs/adr/0009-react-nextjs-fractal-architecture.md): opinionated React structure, server/client boundaries, and URL state.
- [ADR 002 — Vercel AI SDK for tier-3 answers](docs/adr/002-vercel-ai-sdk-for-tier-3.md)
- [ADR 003 — Generative UI with OpenUI Lang](docs/adr/003-genui-openui-foundation.md)
- [GenUI technology comparison](docs/research/2026-10-24-genui-json-vs-openui.md)

Product-engineering principles (product-agnostic scope, capability-first interfaces, agent-ready boundaries) live in [PDR 0001](docs/pdr/0001-agnostic-api-first.md), not in the technology stack ADR.

Accepted direction lives in current contracts and decision records. Research preserves evidence and alternatives. Superseded ADR 0007 and ADR 0008 remain in `docs/adr/` for historical traceability.

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
