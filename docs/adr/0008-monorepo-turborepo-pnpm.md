Date: 2026-10-24

# ADR 0008 — Monorepo with Turborepo and pnpm

**Status:** Superseded · October 24, 2026

> Historical decision. The current foundational architectural rationale is consolidated in [ADR 0001 — Agentic Architecture](0001-agentic-architecture.md). This record is retained for traceability and must not be treated as a separate current source of truth.

## Context

Flow Starter contains a web application, a reusable GenUI package, a shared UI package, and shared TypeScript configuration.

These parts evolve together and benefit from coordinated changes, shared validation, and explicit package boundaries.

We need an efficient way to develop and verify these components without publishing separate packages during initial development.

The hosting and AI provider direction is recorded independently in [ADR 0007](0007-monorepo-vercel-stack.md).

## Decision

Use one monorepo with:

- **pnpm workspaces** for package management and dependency relationships.
- **Turborepo** for task orchestration, dependency-aware execution, and build caching.
- **apps/** for runnable applications.
- **packages/** for shared libraries and configuration.

Current organization:

```text
apps/
  web/          Next.js application

packages/
  genui/        GenUI contracts, orchestration, and React adapter
  ui/           Shared UI components
  ts/           Shared TypeScript configuration
```

Applications depend on shared packages through explicit workspace dependencies.

Do not create new packages merely to separate files by category.

## Dependency boundaries

- Keep reusable domain-neutral contracts in their owning packages.
- Keep application-specific routes and host integrations in the application.
- Preserve server/client separation.
- Avoid circular package dependencies.
- Prefer existing package exports over deep private imports.
- Keep authentication, authorization, and privileged execution at the appropriate host boundary.
- Require evidence of reuse or a clear boundary before extracting another package.

## Workflow and validation

Use the existing pnpm scripts, Turborepo tasks, TypeScript checks, linting, and tests.

Keep local quality checks reproducible.

Do not introduce a competing build orchestrator or package manager.

Turborepo is maintained by Vercel but does not require Vercel hosting.

## Alternatives considered

### Multiple repositories

Allows separate ownership and release cycles, but increases synchronization work for tightly coupled contracts and integration tests.

Not selected for the initial starter.

### Single application without workspace packages

Simpler initially, but less suitable for independent GenUI contracts and shared renderer integrations.

Not selected because the existing package boundaries are meaningful.

### Additional monorepo orchestration tools

No demonstrated need justifies adding another build orchestration system.

## Consequences

- Coordinated code, contracts, and test changes are straightforward.
- Shared dependencies must be managed carefully.
- The build graph remains explicit.
- Package boundaries introduce some maintenance overhead.
- Hosting can change without requiring a monorepo migration.
- Separate package publication remains optional.

## Related documents

- [ADR 0007 — Vercel platform](0007-monorepo-vercel-stack.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [README.md](../../README.md)

## References

- [Turborepo documentation](https://turborepo.com/docs)
- [pnpm workspaces](https://pnpm.io/workspaces)
