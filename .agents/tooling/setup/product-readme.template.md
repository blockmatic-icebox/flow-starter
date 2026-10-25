# {{displayName}}

Web application built with Flow Factory.

## Development

Requires Node.js 24+ and pnpm 12+.

```bash
pnpm setup
pnpm dev
```

Local development: https://{{slug}}.localhost

## Product documentation

- [Product](PRODUCT.md) — Purpose, scope, and requirements.
- [Design](DESIGN.md) — Experience direction and design system.
- [Architecture](ARCHITECTURE.md) — Technical structure and decisions.
- [Agent instructions](AGENTS.md) — Development conventions.

## Workflow

This project uses [Flow](.agents/flow/README.md) to guide product development.

## Quality

```bash
pnpm qa
pnpm ci:local
```
