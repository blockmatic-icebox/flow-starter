# ADR 0007 — Vercel-first platform and AI infrastructure

**Status:** Accepted · October 24, 2026

## Context

Flow Starter provides a reusable technical baseline for building software with human and agent interfaces.

We want an integrated developer experience, fast iteration, useful deployment defaults, and a practical foundation for AI-powered applications.

Vercel maintains several technologies already used by the starter, including Next.js, Turborepo, and the AI SDK. Vercel AI Gateway is the preferred initial provider integration for model-backed features.

Choosing a Vercel-aligned stack does not mean every component is proprietary, every service is hosted on Vercel, or every planned integration has been implemented.

Repository organization is a separate architectural decision in [ADR 0008](0008-monorepo-turborepo-pnpm.md).

## Decision

Use a **Vercel-first, standards-conscious technical baseline** for the starter.

### Web application

Use Next.js App Router with React as the existing application framework.

Preserve the current server/client boundaries, package organization, and rendering behavior. Introduce additional Next.js platform features only when required by concrete application needs.

### AI integration

Use the Vercel AI SDK for the implemented model-backed functionality.

Use Vercel AI Gateway as the initial model access strategy when credentials are configured.

Keep model access optional for the deterministic GenUI baseline. Credentials must remain server-side.

The detailed decision for tier-3 model-backed answers remains in [ADR 002](002-vercel-ai-sdk-for-tier-3.md).

### Deployment direction

Prefer Vercel as the first deployment and integration target when the application requires hosting, previews, and managed platform services.

This is a platform preference, not evidence that the full architecture has already been deployed or production validated.

Do not introduce a dependency on a particular deployment product until the required capability is implemented and verified.

### Independent technologies

Keep independent open-source technologies identifiable as such.

OpenUI Lang, pnpm, Zod, Better Auth, Neon, and Drizzle are not all Vercel technologies. Their selection, implementation status, and maintenance responsibilities must be evaluated separately.

The repository's selected GenUI representation is documented in [ADR 003](003-genui-openui-foundation.md).

### Portability

Do not claim complete cloud or provider independence.

Portability is a design consideration, not a guarantee. Vercel-specific integrations may require adaptation when deploying elsewhere.

Keep domain operations and validated data contracts separate from platform integration code wherever practical.

## Current implementation

| Technology | Responsibility | Status |
| --- | --- | --- |
| Next.js App Router | Web application | Implemented |
| React | UI runtime | Implemented |
| Vercel AI SDK | Model-backed answer generation | Implemented, optional at runtime |
| Vercel AI Gateway | Model provider integration | Supported when configured |
| Turborepo | Workspace task orchestration | Implemented; architectural rationale in ADR 0008 |
| Vercel hosting | Preferred deployment target | Not established as production validated by this ADR |
| Eve | Planned agent runtime integration | Not implemented |
| Better Auth | Planned authentication | Not implemented |
| Neon / Drizzle | Planned persistence | Not implemented |
| MCP Apps host integration | Possible additional client surface | Not implemented |

Update this table when the implementation changes. Do not mark planned capabilities as shipped based on documentation alone.

## Alternatives considered

### Other hosting providers

AWS, Google Cloud, and other platforms may offer greater deployment control or different operational trade-offs.

No quantitative cost, latency, or reliability benchmark is claimed here.

Vercel is the initial preference because it aligns with the existing Next.js and AI SDK development workflow, not because alternatives have been proven inferior.

### Provider-neutral platform abstraction from day one

Rejected as the mandatory baseline because it would introduce abstractions before demonstrating a need for them.

Maintain clear boundaries and address actual portability requirements when they arise.

## Consequences

- The starter has a coherent web and AI development direction.
- Model-backed features can be enabled without changing the deterministic composition baseline.
- Deployment and provider choices remain visible architectural decisions.
- Platform-specific behavior must be tested on the selected target before production claims are made.
- Adopters may choose different infrastructure, but must evaluate the corresponding integration work.
- The monorepo decision can evolve independently of hosting.

## Related documents

- [ADR 0008 — Monorepo with Turborepo and pnpm](0008-monorepo-turborepo-pnpm.md)
- [ADR 002 — Vercel AI SDK](002-vercel-ai-sdk-for-tier-3.md)
- [ADR 003 — OpenUI Lang](003-genui-openui-foundation.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [ROADMAP.md](../../ROADMAP.md)

## References

- [Vercel documentation](https://vercel.com/docs)
- [Next.js documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
