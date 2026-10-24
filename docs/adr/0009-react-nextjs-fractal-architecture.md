Date: 2026-10-24

# ADR 0009 — React and Next.js Fractal Architecture

**Status:** Accepted · October 24, 2026

## Context

Flow Starter provides an opinionated Next.js/React application foundation.

Developers adopting the starter should not need to repeatedly select a component architecture, decide how features are organized, rebuild common application patterns, or reverse-engineer the repository to understand its intended structure.

The architecture is informed by:

[Fractal Components in React](https://gaboesquivel.com/blog/2024-11-react-fractal-compoundnents), published November 25, 2024.

The central principles are:

- Fractal self-similarity.
- Compounding reuse.
- Consistent technical patterns.
- Colocation.
- Shared design systems.
- Avoid Hasty Abstractions (AHA).

We adapt these principles to modern Next.js App Router, React Server Components, an agentic monorepo, and generative interfaces.

## Decision

All first-party React application and component code in Flow Starter follows a consistent **Fractal React Architecture**.

The structure is opinionated and provided as part of the starter.

Product adopters replace product context and domain implementations without reselecting the underlying React architecture.

### 1. Fractal organization

A route, feature, composite and component should follow recognizable, self-similar organizational principles.

Each unit owns its relevant implementation, tests, contracts and supporting components.

Related files remain close to the feature or component they serve.

Avoid scattered global folders that require searching the whole repository to understand one feature.

Self-similarity does not require every directory to have identical subdirectories.

Create only folders and files that have actual responsibilities.

### 2. Colocation

Keep feature-specific React components, hooks, schemas, tests and data adapters close to their owning feature.

Do not promote a component to a shared package merely because it could theoretically be reused.

Keep application routes focused on route integration, data boundaries and composition rather than large collections of unrelated business logic.

Follow established Next.js App Router conventions for route files.

### 3. AHA — Avoid Hasty Abstractions

Do not create abstractions preemptively.

Prefer direct, readable code until reuse, complexity or a stable domain boundary justifies extraction.

Extract when it measurably reduces duplication, enables reuse or protects a meaningful architectural boundary.

Do not create generic base components, factories, wrappers or repositories only to make the folder tree appear more architectural.

### 4. Composition over configuration

Prefer small, specialized components composed through children, slots and clear interfaces.

Avoid monolithic components controlled by many unrelated boolean flags.

Prefer explicit variants when variations represent a coherent, bounded design-system concern.

Keep components independently understandable and testable.

### 5. Server Components by default

Next.js App Router components are Server Components by default.

Use Server Components for server-side data access, initial rendering and noninteractive composition.

Introduce Client Component boundaries only where client state, browser APIs or interaction require them.

Do not turn route layouts or complete feature trees into Client Components unnecessarily.

Pass serializable data from server to client where appropriate.

Use composition to keep server-rendered content outside unnecessarily large client dependency graphs.

### 6. Explicit data and authorization boundaries

Keep privileged operations, secrets and authoritative data access in server-side application boundaries.

Do not import server-only data modules into client-rendered code.

Server Functions, Route Handlers, MCP tools and agent adapters must independently apply applicable validation, authentication and authorization.

A client-side component is never a security boundary.

### 7. Consistent state architecture

Use the following default ownership model.

**Local interaction state:** Use React state for ephemeral values such as open dialogs, temporary form edits and component-local interaction.

**Shareable navigation state:** Use nuqs for query-string state such as search terms, filters, sorting, pagination, selected views and other URL-addressable state.

**Authoritative server state:** Load on the server when appropriate. Use Next.js caching, invalidation and server rendering deliberately.

**Client-managed remote state:** Use TanStack Query when the application needs client caching, background refresh, polling or optimistic synchronization beyond its server-rendering strategy.

Do not adopt another global state library without a demonstrated use case.

Do not store secrets or sensitive state in URL query parameters.

### 8. nuqs is the selected URL-state abstraction

Use nuqs rather than repeatedly hand-writing query-string parsing and URL synchronization across features.

Keep related parsers together when multiple components share URL state.

Prefer typed parsers and consistent URL key naming.

Preserve back/forward navigation and shareable URLs.

Do not replace local ephemeral state with URL state when there is no user benefit.

### 9. One coherent technical stack

Maintain the chosen patterns across features.

The historical React Fractals article illustrates this through:

- React Query for client-side data synchronization.
- nuqs for URL state.
- viem and wagmi for Ethereum features.
- Supabase-based APIs as the historical backend example.
- shadcn/ui and Tailwind for visual consistency.

The underlying architectural principle remains accepted.

Flow Starter adapts these examples to its selected stack:

- Next.js App Router for the application.
- nuqs for URL state.
- Neon and Drizzle for planned PostgreSQL persistence.
- TanStack Query when a feature needs client-managed remote state.
- viem and wagmi only for products implementing EVM functionality.
- Shared authorized capabilities for APIs, MCP tools and agent operations.
- shadcn/ui, Base UI and Tailwind for the design system.

A historical library choice does not supersede the accepted platform architecture.

### 10. Shared design system

Generic visual primitives, design tokens and reusable UI infrastructure belong in `@repo/ui`.

Keep feature-specific components inside the owning application feature.

Avoid custom replacements for existing design-system primitives.

Generated shadcn/Base UI components retain their upstream-compatible conventions.

Do not force all generated components into a new fractal hierarchy.

### 11. Monorepo responsibilities

`apps/web` owns:

- Next.js routes and layouts.
- Feature composition.
- Host integrations.
- Server and client boundaries.
- Application-specific React components.
- Application-specific authorization and capability adapters.

`packages/ui` owns:

- Domain-neutral visual primitives.
- Shared styling.
- UI hooks and utilities.
- Design-system components.

`packages/genui` owns:

- Generative UI contracts.
- Composition and validation.
- Approved component registries.
- React rendering adapters.
- GenUI tests and evaluations.

A package must not depend on an application.

Do not create new packages to represent every feature.

Create package boundaries only when actual reuse or architecture justifies them.

### 12. Generative UI follows the same React architecture

GenUI is not exempt from component architecture.

Generative UI components should:

- Compose from approved reusable views.
- Keep renderers separate from model orchestration.
- Consume validated props and grounded records.
- Respect server/client boundaries.
- Keep authorization in host-owned application operations.
- Reuse the shared design system.
- Avoid one giant renderer with unrelated component logic.

OpenUI Lang remains the approved representation.

See ADR 003 for the generative composition contract.

### 13. Tests and verification

Important components and operations require tests appropriate to their boundaries.

Use unit tests for pure logic, schemas and serializers.

Use component or integration tests when interactive behavior must be verified.

Use browser verification for visible interaction and accessibility changes.

When working in Next.js 16 development, use the available Next.js runtime MCP diagnostic tools to inspect real errors, routes and logs.

Do not replace runtime verification with claims based only on static code reading.

### 14. Documentation for agents

Documentation explains non-obvious intent, ownership, constraints and decisions.

Agents should discover the relevant feature and read its local code after first consulting the appropriate architectural contracts.

Do not require reading the entire repository.

Use AGENTS.md as the lightweight router, ARCHITECTURE.md as the current architecture summary, and this ADR as the durable rationale.

Keep implementation and documentation synchronized.

## Recommended feature shape

For a substantial domain feature:

```text
apps/web/
  app/
    markets/
      page.tsx
      loading.tsx

  features/
    markets/
      components/
        market-list.tsx
        market-card.tsx
        market-filters.tsx
      server/
        get-markets.ts
      hooks/
        use-market-filters.ts
      search-params.ts
      schemas.ts
      market-list.test.ts
```

This structure illustrates responsibility, not mandatory placeholder files.

Do not create unused folders.

For smaller features, colocating everything in the route segment is acceptable.

For shared primitives, use the existing `packages/ui` conventions.

For GenUI, use the established `packages/genui` package layout.

## Enforcement

Objectively verifiable boundaries must be checked automatically where feasible.

Examples:

- Shared packages do not import application code.
- Shared UI packages do not depend on GenUI or private application modules.
- Package consumers use declared exports rather than private source paths.
- Root Next.js layouts remain server-first.
- Source-only Node APIs do not leak into browser-facing UI primitives.
- Important contracts remain covered by tests.

Subjective principles remain review requirements:

- Fractal organization.
- AHA.
- Component responsibility.
- Composition quality.
- Whether a proposed abstraction is justified.
- Appropriate placement of state.
- Appropriate Client Component boundaries.

Do not pretend a linter can evaluate these conceptual qualities perfectly.

## Exceptions

Exceptions require a concrete technical reason.

Framework-generated source may follow the generating framework's conventions.

Third-party and shadcn-generated UI components may retain their upstream shape.

An unusual feature organization is acceptable when it demonstrably improves cohesion and maintainability.

Document consequential deviations close to their implementation or in the existing owning specification.

Do not create a new ADR for every exception.

## Consequences

- Developers inherit a coherent React architecture.
- Coding agents have explicit structural rules.
- Features should be easier to locate and maintain.
- URL state behaves consistently.
- Shared UI stays consistent.
- Server/client boundaries remain explicit.
- Generative UI follows the same component engineering standards.
- The architecture reduces repeated decision-making.
- Maintaining these conventions requires human and automated review.
- Adopters intentionally accept an opinionated React/Next.js baseline.

## References

- [Fractal Components in React](https://gaboesquivel.com/blog/2024-11-react-fractal-compoundnents)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [nuqs](https://nuqs.dev/)
- [nuqs Next.js adapter](https://nuqs.dev/docs/adapters)
- [Turborepo](https://turborepo.com/docs)
- [ADR 0001](0001-agentic-architecture.md)
- [ADR 003](0003-genui-openui-foundation.md)
