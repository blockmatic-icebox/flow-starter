# Project Name

<!-- Replace this heading and description with your product identity. -->

Briefly describe what your product does, who it serves, and the value it provides.

## Getting started

Requirements:

- Node.js 24+
- pnpm 12+

Install dependencies:

```bash
pnpm install
```

`pnpm setup` also prepares environment templates. `pnpm setup:full` installs optional local tools (skills, secret scanners, Portless, DeepSec, Playwright). Scanner installation may require administrator rights. See the [foundation guide](docs/readme.md).

Start the application:

```bash
pnpm dev
```

The application uses Portless for its normal local development environment.

To bypass Portless:

```bash
pnpm --filter web dev:app
```

For first-time Portless setup:

```bash
pnpm setup:portless
```

## Development commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start local development |
| `pnpm build` | Build applications and packages |
| `pnpm lint` | Lint and formatting checks |
| `pnpm check-types` | TypeScript checks |
| `pnpm test` | Application and package tests |
| `pnpm qa` | Standard non-mutating quality checks |
| `pnpm ci:local` | Full local CI, including production build |
| `pnpm flow:check` | Validate Flow documentation conventions |
| `pnpm architecture:check` | Validate React monorepo architecture boundaries |
| `pnpm mcp:next` | Next.js development diagnostics for compatible coding agents |

## Architecture

This application uses the opinionated [Flow Starter](docs/readme.md) foundation.

The inherited technical architecture includes:

- Next.js App Router and React.
- TypeScript and a pnpm/Turborepo monorepo.
- Fractal React component organization.
- Server-first rendering and intentional client boundaries.
- Shared UI components and design tokens.
- Capability-first application boundaries.
- MCP-oriented integration patterns.
- Validated generative UI using OpenUI Lang.
- Agent-readable documentation and development conventions.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the current technical contract.

Review the relevant architectural decisions before making consequential changes to the inherited foundation.

## Product documentation

| Document | Responsibility |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | Product vision, audience, scope and requirements |
| [DESIGN.md](DESIGN.md) | Product experience, visual direction and interaction |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical architecture and boundaries |
| [AGENTS.md](AGENTS.md) | Entry point for coding agents |
| [Flow for humans](docs/workflow/readme.md) | Introduction to the development methodology |
| [Flow Starter foundation](docs/readme.md) | Inherited architecture, tools and adoption guidance |

## Configuration

Use the relevant application's `.env.example` file to identify supported environment variables.

Create local environment configuration only when required.

Never commit credentials or secrets.

For inherited examples and optional integrations, see the [Flow Starter foundation guide](docs/readme.md).

## Adopting this template

When starting your product:

1. Replace this README's project name and description.
2. Define the product in PRODUCT.md.
3. Define the visual and interaction direction in DESIGN.md.
4. Replace fictional fixtures and demonstration content as needed.
5. Configure only the integrations required by your application.
6. Preserve relevant architecture and workflow contracts.
7. Implement features within the established application boundaries.
8. Run `pnpm qa` and `pnpm ci:local` before shipping.

The starter provides the architecture.

Your application defines its own users, domain, capabilities and product goals.
