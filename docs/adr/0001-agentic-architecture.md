Date: 2026-10-24

# ADR 0001 — Agentic Architecture

**Status:** Accepted · October 24, 2026

## Context

Flow Starter is a reusable foundation for building software intended to work naturally with humans, applications, and AI agents.

Traditional application architectures often place important behavior inside a specific user interface. Agent-accessible applications need clear capabilities, controlled execution, reusable contracts, and trustworthy results that can be used across multiple interfaces.

We want an architecture that supports:

- Human-friendly interfaces.
- Agent-accessible capabilities.
- API and MCP interoperability where justified.
- Reusable business operations and contracts.
- Secure authorization and approval boundaries.
- Generative interfaces built from validated components.
- Fast iteration and continuous delivery.
- Isolated development, testing, and preview environments.
- Reproducible engineering workflows.
- A practical foundation for solo developers and small technical teams.

We prefer an integrated ecosystem where technologies reinforce one another, but avoid unnecessary abstraction and premature implementation of every possible integration.

The application is a starter, not a completed agent platform or product.

## Decision

Adopt an **agent-first, capability-first, Vercel-aligned architecture** with explicit contracts, reusable actions, controlled interfaces, and a development workflow designed for incremental delivery.

"Agent-first" means agents are considered legitimate consumers and participants in the system. It does not mean agents have unrestricted authority, replace human interaction, or require every feature to use an LLM.

"Capability-first" means reusable operations and their contracts are designed independently of any single UI or agent prompt.

"Vercel-aligned" means choosing the Vercel ecosystem as the primary integration direction for application and agent infrastructure, while keeping independent open-source technologies and portability trade-offs visible.

## Architecture principles

### 1. Humans and agents share capabilities

Where an operation is needed by both humans and agents, expose it through a shared, validated application boundary rather than duplicating its business logic.

The same operation should apply consistent validation, authorization, domain rules, and error semantics regardless of its caller.

A web interface, HTTP endpoint, MCP tool, or agent tool is an adapter around an authorized capability.

Not every internal function needs an external interface.

### 2. Agent-ready, not agent-controlled

Agent output is untrusted input.

Agents may request actions but must not gain authority merely by generating tool calls, UI documents, or natural-language instructions.

Sensitive operations require host-enforced identity, authorization, approval, input validation, and auditability as appropriate.

### 3. API-first where useful, MCP-ready by design

Capabilities should have machine-readable contracts when they need multiple consumers.

HTTP APIs are a primary integration surface.

MCP is the preferred interoperability candidate when external agent hosts need tools, resources, or interactive experiences.

Do not create HTTP endpoints or MCP servers without real consumers.

### 4. Controlled generative UI

Generated interfaces must be composed through validated schemas, approved components, controlled data references, and host-owned rendering and action boundaries.

The current GenUI implementation uses OpenUI Lang.

Do not allow arbitrary model-generated frontend code or privileged action definitions.

See [ADR 003](0003-genui-openui-foundation.md).

### 5. Progressive implementation

Implement the smallest useful vertical slice first.

Technologies selected for future integration are architectural direction, not evidence that those integrations are complete.

Avoid scaffolding unused services solely because they appear in this ADR.

### 6. Continuous delivery with isolated environments

Favor workflows where every meaningful change can be tested independently before promotion.

The intended development loop is:

Explore → Specify → Plan → Build → Review → Ship

For code changes involving deployment and persistence:

Code change → automated checks → isolated preview → database migration verification → review → approved promotion → monitoring.

This is the intended workflow, not a claim that every step is currently automated.

Continuous delivery must remain distinct from durable agent execution.

### 7. Explicit boundaries and portable contracts

Keep application contracts and domain operations as independent as practical from deployment adapters, presentation surfaces, and provider-specific APIs.

Do not claim zero vendor lock-in.

Evaluate portability based on real needs and measurable switching costs.

## Technology selection

The following decisions explain the intended technical stack.

Status descriptions reflect the architecture at the time of this decision. Refer to [ARCHITECTURE.md](../../ARCHITECTURE.md) for current implementation status.

### Vercel — preferred agentic infrastructure

**Selection:** Preferred application deployment and AI integration platform.

**Why:**

- Native alignment with the existing Next.js application.
- Git-connected preview deployments.
- Consistent developer and deployment workflows.
- AI SDK and AI Gateway integration.
- Agent-oriented tools and platform APIs.
- A relevant ecosystem for future execution, observability, and secure integrations.

**Benefits:**

- Less integration work for the selected TypeScript stack.
- Useful development and preview environments.
- Centralized model provider access when AI Gateway is enabled.
- A path for extending agent execution without immediately operating custom infrastructure.

**Trade-offs:**

- Provider-specific deployment behavior.
- Usage-based costs and service limits.
- Potential migration work for alternative hosting platforms.
- Infrastructure convenience does not replace application security.

**Status:** Selected platform direction; do not assume production deployment has been verified.

**Alternatives:** AWS, Google Cloud, self-hosted Node infrastructure, and other compatible deployment platforms.

### Next.js App Router — application framework

**Selection:** Next.js with React.

**Why:**

- Integrated server and client application model.
- Route handling and rendering in one application framework.
- Natural fit for the selected Vercel platform.
- Ability to integrate server-side capabilities with human-facing interfaces.
- Existing working implementation in the starter.

**Trade-offs:**

- Framework-specific conventions.
- Server/client boundary complexity.
- Additional adaptation for other frameworks.

**Status:** Implemented.

React component and feature structure is intentionally opinionated, following Fractal React Architecture, server-first Next.js boundaries, consistent URL state, and AHA. See [ADR 0009](0009-react-nextjs-fractal-architecture.md).

### TypeScript and Node.js — shared application language and runtime

**Selection:** TypeScript for application, shared packages, contracts, and future agent tooling; Node.js for existing server execution.

**Why:**

- Shared types across package boundaries.
- Compatibility with the selected application and AI tools.
- A coherent codebase for humans and coding agents.
- Reduced integration friction across app, library, and backend code.

**Trade-offs:**

- Type safety does not replace runtime validation.
- Runtime compatibility and package versions still require testing.

**Status:** Implemented.

### Vercel AI SDK — model and agent programming interface

**Selection:** Vercel AI SDK.

**Why:**

- TypeScript-friendly abstractions for model calls.
- Structured outputs, tool calls, and streaming.
- Broad provider integration.
- Compatibility with the existing GenUI implementation.
- A consistent way to integrate model-backed behavior without coupling the application to one model vendor.

**Trade-offs:**

- SDK version compatibility.
- Different model providers may support different capabilities.
- Model output still requires validation and grounding.

**Status:** Implemented for optional tier-3 answers.

**Related decision:** [ADR 002](0002-vercel-ai-sdk-for-tier-3.md).

### Vercel AI Gateway — preferred model access layer

**Selection:** AI Gateway when model-backed features are configured.

**Why:**

- Centralized access to multiple model providers.
- A consistent model identification and authentication interface.
- Provider routing, usage visibility, and operational controls.
- Lower application coupling to individual provider clients.

**Trade-offs:**

- Dependence on a gateway service.
- Potential additional operational, policy, latency, and cost considerations.
- Gateway availability does not guarantee identical behavior across models.

**Status:** Supported by the existing optional model integration.

### Eve — planned application agent runtime

**Selection:** Eve as the preferred agent runtime for future full agent capabilities.

**Why:**

- Agent definitions, tools, and channels in a TypeScript-oriented runtime.
- Tool delegation and multi-channel application integration.
- Durable execution and human approval concepts.
- Compatibility with the wider Vercel agent ecosystem.
- A path to reusing application capabilities rather than creating separate agent-only business logic.

**Trade-offs:**

- Runtime integration and operational complexity.
- Need to verify persistence, authorization, cancellation, and recovery.
- Must not duplicate another agent executor or durable workflow system unnecessarily.

**Status:** Planned; not part of the currently implemented GenUI demo.

### Neon — selected Postgres and agent-friendly database platform

**Selection:** Neon Postgres for future application persistence.

**Why:**

- PostgreSQL compatibility.
- Database branches for isolated development and testing.
- A branch-per-preview workflow that can complement Vercel deployments.
- Migration verification on isolated database branches.
- Programmatic database management through CLI and APIs.
- Agent-accessible management tools through MCP and typed SDK/tool integrations.
- A practical model for treating application code and database changes as coordinated deliverables.

Neon branching enables database isolation; it is not itself a deployment system or a durable agent runtime.

**Intended continuous delivery workflow:**

1. Create a code branch or pull request.
2. Create or allocate an isolated Neon branch when database changes require it.
3. Apply and test database migrations safely.
4. Connect the preview application to the corresponding database environment.
5. Run relevant automated and human verification.
6. Promote approved application changes and production migrations through controlled steps.
7. Clean up temporary environments.

The exact automation and integration must be implemented and verified before being declared production ready.

**Agent access policy:**

- Prefer development or isolated preview database branches.
- Use the smallest necessary permissions.
- Do not expose production database credentials to coding agents by default.
- Prefer read-only operations for inspection.
- Require review and authorization for destructive or sensitive operations.
- Keep credentials out of the repository, prompts, and logs.

**Trade-offs:**

- Managed-service dependency.
- Branch lifecycle, resource usage, and cost management.
- Connection behavior and concurrency constraints.
- Production migration safety remains the application's responsibility.

**Status:** Baseline implemented in `@repo/db` with Neon Local for development; preview branch automation and product schema remain planned.

**Alternatives:** Self-hosted PostgreSQL, managed PostgreSQL from other providers, and alternative persistence systems where product needs justify them.

### Drizzle ORM — typed relational data access and migrations

**Selection:** Drizzle for the future application data layer.

**Why:**

- TypeScript schema definitions.
- SQL-oriented query construction.
- Typed integration with PostgreSQL.
- Migration files that can be reviewed and versioned.
- Documented Neon connection support.

**Trade-offs:**

- Database schema changes still need migration review.
- ORM types do not replace database constraints.
- Driver and transaction behavior depend on the selected connection strategy.

**Status:** Baseline implemented in `@repo/db` (schema, migrations, client); application routes do not require persistence until adopters add product tables.

### Better Auth — planned application identity

**Selection:** Better Auth for application authentication.

**Why:**

- TypeScript-oriented, framework-agnostic auth architecture.
- OAuth providers, including GitHub.
- Session and account management.
- Extensible authentication capabilities.
- Database integration, including Drizzle adapters.
- Fits an architecture where agents and interfaces need explicit user identity and authorization.

**Trade-offs:**

- Authentication must be correctly integrated with application authorization.
- Agent actions need explicit caller and permission checks.
- Provider credentials, sessions, and token exchange require careful lifecycle management.

**Status:** Planned.

Do not treat a session library as a complete permission model for privileged agent operations.

### OpenUI Lang — validated generative interface representation

**Selection:** OpenUI Lang for current GenUI presentation.

**Why:**

- Existing implementation experience and reusable source architecture.
- Declarative interface representation.
- Validated component composition.
- Shared compiler and React rendering boundaries.
- Avoidance of two competing composition representations in the initial application.

**Trade-offs:**

- Framework-specific component contracts.
- Integration work for other rendering hosts.
- Model-supported composition remains constrained by available components and validation rules.

**Status:** Implemented.

**Related decision:** [ADR 003](0003-genui-openui-foundation.md).

**Research:** [OpenUI and json-render comparison](../research/20261024-genui-json-vs-openui.md).

### Zod — runtime validation

**Selection:** Zod for structured inputs, contracts, and UI composition props.

**Why:**

- Runtime validation complements TypeScript types.
- Compatible with the current compiler and AI SDK patterns.
- Explicit schemas help enforce boundaries between untrusted generated content and application behavior.

**Trade-offs:**

- Schemas require maintenance.
- Validation does not independently establish authorization or truthfulness.

**Status:** Implemented.

### shadcn/ui, Base UI and Tailwind CSS — shared presentation layer

**Selection:** Existing shared UI package using shadcn/ui patterns, Base UI primitives, and Tailwind CSS.

**Why:**

- Source-owned components and styles.
- Reusable design tokens.
- Composable components for both conventional and generative presentation.
- Accessible interaction primitives as a foundation for application UI.
- Consistent rendering across the starter's approved component catalog.

**Trade-offs:**

- Components still require accessibility testing.
- Shared design-system changes affect multiple experiences.
- Adoption requires replacing starter-specific visual decisions.

**Status:** Implemented.

### pnpm and Turborepo — workspace and build system

**Selection:** pnpm workspaces with Turborepo.

**Why:**

- Manage the application and shared packages in one repository.
- Reuse contracts and components without cross-repository synchronization.
- Coordinate build, test, and typecheck tasks.
- Support dependency-aware execution and caching.
- Keep package boundaries explicit.

Turborepo is maintained by Vercel but does not require Vercel hosting.

**Trade-offs:**

- Monorepo-wide dependency and configuration coordination.
- Task graph and cache maintenance.
- Shared packages may require deliberate ownership boundaries.

**Status:** Implemented.

**Alternatives:** Separate repositories or a single unstructured application.

### GitHub and GitHub Actions — version control and continuous delivery

**Selection:** GitHub as repository workflow and GitHub Actions for automated verification when enabled.

**Why:**

- Versioned changes and code review.
- Reproducible checks.
- Alignment with Vercel preview workflows.
- A path to coordinating application, schema, security, and deployment verification.

**Trade-offs:**

- Secrets and workflow permissions require explicit controls.
- CI configuration must be reviewed before automatic execution.
- CI passing does not prove production correctness.

**Status:** Local checks and manually triggered GitHub Actions workflows exist. Automatic PR/push-based delivery is not enabled by this decision.

### Quality and security tools

**Selection:** Existing lint, formatting, TypeScript, testing, and security tooling.

Includes oxlint, oxfmt, knip, sherif, gitleaks, OSV Scanner, `pnpm audit`, the Node.js test runner, browser testing when needed, and the configured DeepSec workspace.

**Why:**

- Fast local verification.
- Deterministic checks before delivery.
- Consistent code quality.
- Security review as an additional validation layer.

**Trade-offs:**

- Static checks do not replace runtime testing.
- AI-assisted scanning may require paid processing and may produce false positives.
- Browser and integration testing require appropriate environments.

**Status:** Local gates and manual GitHub Actions workflows are configured; automatic push/PR CI remains disabled until adopters enable it. Distinguish installed tooling from completed DeepSec or browser verification runs.

### Agent skills and Flow documentation

**Selection:** Agent Skills-compatible instructions, a versioned skills manifest, AGENTS.md, and docs/workflow/flow.md.

**Why:**

- Reusable technical and methodological expertise.
- Coding-agent agnosticism.
- Progressive disclosure of context.
- Explicit product, design, architecture, and decision ownership.
- Repeatable human and agent workflows.

**Trade-offs:**

- Skill installation does not guarantee skill execution.
- Third-party skill instructions must be reviewed and bounded.
- Too many simultaneously loaded skills can create contradictions and context overhead.

**Status:** Implemented as repository conventions and an installed skill manifest.

### MCP and MCP Apps — planned interoperability

**Selection:** MCP-compatible capabilities as an interoperability direction, with MCP Apps considered for supported interactive hosts.

**Why:**

- Reuse application operations from external agent clients.
- Standardize tool and resource exposure when necessary.
- Extend approved application experiences to additional hosts.
- Avoid separate implementations of the same business operation for every channel.

**Trade-offs:**

- Host capabilities vary.
- Authentication and authorization remain necessary.
- Embedded UI support is not universal.
- More protocol surfaces increase testing and maintenance needs.

**Status:** Planned; not a completed production integration.

## Technologies evaluated but not adopted as mandatory foundations

### Vercel Workflows and Sandbox

These are relevant candidates for durable tasks and isolated execution.

Do not add them as mandatory dependencies merely because they are available.

Evaluate them against Eve's actual runtime capabilities and the application's needs before introducing a second orchestration or execution system.

### Alternative GenUI representations

json-render and other representation systems remain research alternatives.

The initial system intentionally uses one primary GenUI contract.

### Additional Neon platform services

Do not automatically adopt every Neon product or service.

Neon Postgres and database branching motivate the current selection; other services require their own real use cases.

## Cross-technology integration model

The intended relationships are:

1. **Human and agent requests** enter through authorized client interfaces.
2. **Capability contracts** define operations independently of presentation.
3. **Host boundaries** authenticate, authorize, validate, and execute sensitive actions.
4. **Eve**, when implemented, coordinates agent work through the same approved capabilities.
5. **AI SDK and AI Gateway** provide optional model-backed behavior.
6. **OpenUI Lang and React** provide validated human-facing presentation.
7. **Better Auth**, when implemented, provides identity and session capabilities.
8. **Neon and Drizzle**, when implemented, provide persistent application data and migration workflows.
9. **Vercel and GitHub** provide the preferred path for preview, delivery, and deployment.
10. **Flow and agent skills** support engineering work without becoming application runtime dependencies.

These layers must not be collapsed into one privileged agent process or one UI-specific implementation.

## Decision boundaries

This ADR owns the architectural vision and the reasons for choosing the technology stack.

[ARCHITECTURE.md](../../ARCHITECTURE.md) owns current technical boundaries and implementation status.

[ARCHITECTURE.md](../../ARCHITECTURE.md) describes current technical boundaries and implementation status.

[PDR 0001](../pdr/0001-agnostic-api-first.md) owns product-agnostic and capability-first product-engineering principles.

[docs/workflow/flow.md](../../docs/workflow/flow.md) owns the software development workflow.

[ADR 002](0002-vercel-ai-sdk-for-tier-3.md) and [ADR 003](0003-genui-openui-foundation.md) preserve narrower implementation decisions.

Historical [ADR 0007](0007-monorepo-vercel-stack.md) and [ADR 0008](0008-monorepo-turborepo-pnpm.md) have been consolidated into this foundational record.

Do not duplicate the full technology rationale in README.md or ARCHITECTURE.md.

## Reconsideration criteria

Reconsider a selected technology when there is credible evidence of:

- An unmet capability required by an adopter.
- Unacceptable security or authorization limitations.
- Material operational cost or performance constraints.
- Repeated deployment or integration failures.
- Excessive dependency on one provider.
- Unsupported platform or runtime compatibility.
- Significant maintenance burden with a demonstrably better alternative.

Use measurable project evidence rather than changing providers merely because a newer technology exists.

## Historical provenance

This record replaces the original `docs/adr/001-use-flow-starter.md` baseline decision through an explicitly approved documentation migration.

The original decision text remains available in repository Git history.

Prior committed revision before migration: `13d4f89368ccb8224098f544674244094a63b814` (`docs(adr): split platform and monorepo; harden GenUI and DeepSec`).

## Primary references

- [Vercel platform](https://vercel.com/docs)
- [Vercel agent stack](https://vercel.com/agents)
- [AI SDK](https://ai-sdk.dev/docs/introduction)
- [AI Gateway](https://vercel.com/docs/ai-gateway)
- [Eve](https://eve.dev/)
- [Neon database branching workflow](https://neon.com/docs/get-started-with-neon/workflow-primer)
- [Neon agent tools](https://neon.com/blog/give-your-agent-neon-tools)
- [Neon and Vercel preview integration](https://neon.com/blog/neon-vercel-native-integration)
- [Neon MCP safety](https://neon.com/blog/mcp-safety-cheatsheet)
- [Drizzle and Neon](https://orm.drizzle.team/docs/connect-neon)
- [Drizzle migrations](https://orm.drizzle.team/docs/migrations)
- [Better Auth](https://better-auth.com/docs/introduction)
- [Turborepo](https://turborepo.com/docs)
- [pnpm workspaces](https://pnpm.io/workspaces)
- [OpenUI Lang](https://www.openui.com/docs/openui-lang)
- [MCP specification](https://modelcontextprotocol.io/specification)
