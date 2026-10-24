Date: 2026-10-24

# ADR 0001 — Agentic Architecture

**Status:** Accepted

## Context

Flow Starter is a reusable foundation for building software intended to work naturally with humans, applications, and AI agents.

Traditional application architectures often place important behavior inside a specific user interface. Agent-accessible applications need clear capabilities, controlled execution, reusable contracts, and trustworthy results that can be used across multiple interfaces.

We prefer an integrated ecosystem where technologies reinforce one another, but avoid unnecessary abstraction and premature implementation of every possible integration.

The application is a starter, not a completed agent platform or product.

## Decision

Adopt an **agent-first, capability-first, Vercel-aligned architecture** with explicit contracts, reusable actions, controlled interfaces, and incremental delivery.

Product-engineering principles (capability-first operations, API and MCP readiness, lean interfaces) live in [PDR 0001](../pdr/0001-agnostic-api-first.md). The engineering lifecycle lives in [docs/workflow/flow.md](../workflow/flow.md).

### Controlled generative UI

Generated interfaces must be composed through validated schemas, approved components, controlled data references, and host-owned rendering and action boundaries. The current GenUI implementation uses OpenUI Lang ([ADR 0003](0003-genui-openui-foundation.md)). Do not allow arbitrary model-generated frontend code or privileged action definitions.

### Progressive implementation

Implement the smallest useful vertical slice first. Technologies selected for future integration are architectural direction, not evidence that those integrations are complete.

### Continuous delivery with isolated environments

Favor workflows where every meaningful change can be tested independently before promotion. For deployment and persistence: code change → automated checks → isolated preview → migration verification → review → approved promotion → monitoring. Not every step is automated today.

### Explicit boundaries and portable contracts

Keep application contracts and domain operations as independent as practical from deployment adapters, presentation surfaces, and provider-specific APIs. Do not claim zero vendor lock-in.

### Technology selection

[ARCHITECTURE.md](../../ARCHITECTURE.md) and package manifests are the source of truth for versions, scripts, and what runs today. This table records **why** the stack was chosen.

| Area | Selection | Status (direction) | Detail |
| --- | --- | --- | --- |
| Platform | Vercel | Selected | Next.js deployment, previews, AI Gateway path |
| Application | Next.js App Router + React | Implemented | [ADR 0009](0009-react-nextjs-fractal-architecture.md) |
| Language | TypeScript on Node.js | Implemented | Shared types across apps and packages |
| Models | Vercel AI SDK (+ Gateway when configured) | Implemented for optional tier-3 GenUI | [ADR 0002](0002-vercel-ai-sdk-for-tier-3.md) |
| GenUI | OpenUI Lang | Implemented in `@repo/genui`, hosted in `apps/flow` | [ADR 0003](0003-genui-openui-foundation.md), [spec](../specs/genui.md) |
| Agent runtime | Eve | Planned | [ADR 0004](0004-voice-delegates-to-eve.md) |
| Data | Neon Postgres + Drizzle (`@repo/db`) | Baseline shipped | Product tables and auth data are adopter-owned |
| Auth | Better Auth | Planned | No login UI in the starter |
| UI system | shadcn/ui, Base UI, Tailwind (`@repo/ui`) | Implemented |  |
| Workspace | pnpm + Turborepo | Implemented | Supersedes [ADR 0007](0007-monorepo-vercel-stack.md) / [0008](0008-monorepo-turborepo-pnpm.md) |
| Interop | MCP (+ MCP Apps later) | Partial | Read-only Flow Agent MCP in `apps/flow`; [ADR 0010](0010-site-consultant-chat-and-mcp.md), [0012](0012-flow-and-web-applications.md) |
| Validation | Zod | Implemented | Request bodies, GenUI props, agent tools |
| Engineering | Flow workflow, ADRs, agent skills | Implemented | [docs/workflow/flow.md](../workflow/flow.md) |

### Cross-technology integration model

1. Human and agent requests enter through authorized client interfaces.
2. Capability contracts define operations independently of presentation.
3. Host boundaries authenticate, authorize, validate, and execute sensitive actions.
4. Eve, when implemented, coordinates agent work through the same approved capabilities.
5. AI SDK and AI Gateway provide optional model-backed behavior.
6. OpenUI Lang and React provide validated human-facing presentation.
7. Better Auth, when implemented, provides identity and session capabilities.
8. Neon and Drizzle provide the database baseline; product persistence wiring remains adopter work.
9. Vercel and GitHub provide the preferred path for preview, delivery, and deployment.
10. Flow and agent skills support engineering work without becoming application runtime dependencies.

These layers must not be collapsed into one privileged agent process or one UI-specific implementation.

Reconsider a selected technology when credible evidence shows unmet capability, security limits, operational cost, repeated integration failure, or a demonstrably better alternative. Use measurable project evidence.

## Alternatives considered

- **Vercel Workflows and Sandbox as mandatory foundations.** Rejected until Eve and application needs justify a second orchestration system.
- **json-render and parallel GenUI compilers.** Rejected for the initial foundation; one primary contract ([ADR 0003](0003-genui-openui-foundation.md), [research](../research/20261024-genui-json-vs-openui.md)).
- **Every Neon platform service by default.** Rejected; adopt additional services only with a concrete use case.
- **UI-bound business logic as the default.** Rejected; see [PDR 0001](../pdr/0001-agnostic-api-first.md).

## Consequences

- [ARCHITECTURE.md](../../ARCHITECTURE.md) owns current technical boundaries and implementation status.
- Narrower implementation decisions remain in [ADR 0002](0002-vercel-ai-sdk-for-tier-3.md), [ADR 0003](0003-genui-openui-foundation.md), and related records.
- Do not duplicate the full technology rationale in README.md or ARCHITECTURE.md.
- Historical [ADR 0007](0007-monorepo-vercel-stack.md) and [ADR 0008](0008-monorepo-turborepo-pnpm.md) are superseded by this record.

## Related documents

- [PDR 0001](../pdr/0001-agnostic-api-first.md)
- [docs/workflow/flow.md](../workflow/flow.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- Prior revision before consolidation: `13d4f89368ccb8224098f544674244094a63b814` (`docs(adr): split platform and monorepo; harden GenUI and DeepSec`). Replaces `docs/adr/001-use-flow-starter.md` (Git history).
- [Vercel platform](https://vercel.com/docs), [AI SDK](https://ai-sdk.dev/docs/introduction), [Eve](https://eve.dev/), [OpenUI Lang](https://www.openui.com/docs/openui-lang), [MCP specification](https://modelcontextprotocol.io/specification)
