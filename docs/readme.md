# Flow Starter

An opinionated foundation for building agentic products with Next.js, React and TypeScript.

## Mission

**Make the architectural decisions once, so developers and agents can focus on building the product.**

Flow Starter provides a carefully selected technical architecture, reusable capabilities, agent-oriented development tools, documentation conventions and an established engineering workflow.

It is intended for independent developers, solo founders and small technical teams.

Instead of repeatedly selecting frameworks, configuring infrastructure, designing component conventions and establishing engineering processes, adopters begin with a coherent foundation.

The foundation is technology-opinionated and business-domain-agnostic.

Developers inherit the architecture while defining their own product, users, domain and experience.

## Goals

### 1. Accelerate product development

Eliminate repetitive decisions about frameworks, architecture, infrastructure, component patterns, development tools and verification.

Allow developers to concentrate on product requirements, customers and functionality.

### 2. Build agent-first applications

Treat agents as legitimate consumers of application capabilities.

Favor reusable operations, typed contracts, authorization, API interoperability and MCP-compatible interfaces.

Human interfaces and agents should use the same authorized application operations wherever appropriate.

Agent-first does not mean unrestricted agent authority.

### 3. Provide a cohesive technical foundation

Choose technologies that work well together instead of presenting multiple competing framework and infrastructure options.

The selected direction includes Next.js, React, TypeScript, Vercel, AI SDK, OpenUI Lang and reusable monorepo packages.

The architecture also selects Eve, Better Auth, Neon and Drizzle for future integration.

Selection does not mean every integration is currently implemented.

See [ADR 0001](adr/0001-agentic-architecture.md) for the underlying architectural rationale.

### 4. Maintain a consistent React architecture

Use Fractal React Architecture, composition, colocation, AHA (Avoid Hasty Abstractions), server-first Next.js boundaries and consistent state ownership.

Use nuqs for URL-addressable state.

Extract shared abstractions only when justified by actual reuse or architectural boundaries.

See [ADR 0009](adr/0009-react-nextjs-fractal-architecture.md).

### 5. Make the codebase understandable to agents

Preserve architecture intent, ownership, constraints and consequential decisions in concise, synchronized documentation.

Reduce the need for coding agents to reverse-engineer the entire repository before performing a task.

Use progressive disclosure and task-based navigation.

### 6. Support composable and generative interfaces

Use reusable components, validated presentation contracts and controlled generative UI.

The implemented foundation uses OpenUI Lang, an approved component catalog and a shared React rendering layer.

Generated interfaces must respect host-owned authorization and data boundaries.

See [ADR 0003](adr/0003-genui-openui-foundation.md).

### 7. Improve the agentic developer experience

Help coding agents understand the repository, implement capabilities, apply appropriate skills, inspect runtime behavior and verify changes.

Use framework-aware diagnostics, browser verification and reproducible checks.

### 8. Enable reliable continuous delivery

Provide repeatable development and verification workflows, with a path to isolated environments, database migration checks and controlled deployment.

Do not confuse the intended delivery architecture with infrastructure that has not been implemented.

### 9. Remain reusable across products

Preserve the technical foundation while enabling adopters to define their own business domain, interfaces, capabilities and integrations.

Flow Starter is not tied to one product idea.

## What the starter provides

| Area | Foundation |
| --- | --- |
| Web application | Next.js App Router, React and TypeScript |
| Workspace | pnpm and Turborepo |
| React architecture | Fractal composition and server-first boundaries |
| UI | Shared shadcn/ui, Base UI and Tailwind primitives |
| URL state | nuqs |
| AI integration | Vercel AI SDK and optional AI Gateway |
| Generative UI | OpenUI Lang, validated components and React rendering |
| Agent interoperability | Capability-first patterns and MCP integration examples |
| Developer tools | Next.js runtime diagnostics, browser verification and skills |
| Quality | Typechecking, linting, unit tests and architecture checks |
| Methodology | Explore → Specify → Plan → Build → Review → Ship |
| Documentation | AGENTS.md, ADRs, PDRs, research and specifications |

## Implemented foundation

The repository includes:

- A Next.js application.
- A reusable GenUI package and demonstration.
- A generative UI composition API.
- A site consultant chat example.
- A read-only consultant MCP example.
- Shared design-system components.
- An agent skills manifest.
- Next.js development MCP tooling.
- React architecture boundary checks.
- Documentation validation.
- Local quality and CI commands.

These are foundation capabilities and demonstration integrations.

They do not establish that every adopter's application is ready for production.

## Selected future integrations

The architecture identifies additional integrations that can be implemented when needed:

- Eve for agent runtime capabilities.
- Better Auth for application authentication.
- Neon Postgres and Drizzle for persistence.
- Shared authorized operations for humans and agents.
- Further MCP and MCP Apps integration.
- Isolated preview and migration workflows.
- A more complete agent workspace.

These are architectural directions, not claims that the integrations are complete.

See [ARCHITECTURE.md](../ARCHITECTURE.md) for current technical boundaries and implementation status.

## How Flow works

Flow is the development methodology accompanying the starter.

**Explore → Specify → Plan → Build → Review → Ship**

It helps humans and coding agents move from uncertainty to verified software without unnecessary process.

Read the [human introduction to Flow](workflow/readme.md).

The [operational Flow contract](workflow/flow.md) defines documentation ownership, conventions and workflow behavior.

The distinction is intentional:

- Flow defines how engineering work is organized.
- Flow Starter provides a selected technical architecture.

## Documentation map

### Product definition

- [README.md](../README.md) — application README template.
- [PRODUCT.md](../PRODUCT.md) — product vision, scope and requirements.
- [DESIGN.md](../DESIGN.md) — visual and interaction direction.

### Agent and engineering documentation

- [AGENTS.md](../AGENTS.md) — agent entrypoint and context navigation.
- [ARCHITECTURE.md](../ARCHITECTURE.md) — current technical structure and boundaries.
- [Flow contract](workflow/flow.md) — workflow and documentation conventions.
- [ADR 0001](adr/0001-agentic-architecture.md) — foundational architecture.
- [ADR 0009](adr/0009-react-nextjs-fractal-architecture.md) — React and Next.js conventions.
- [ADR 0003](adr/0003-genui-openui-foundation.md) — GenUI foundation.
- [GenUI specification](specs/genui/readme.md) — detailed GenUI contracts.

Research and decision records provide context when a task requires them.

Do not read all documents by default.

## Foundation development

The repository includes reproducible checks:

```bash
pnpm qa
pnpm ci:local
```

For focused validation:

```bash
pnpm architecture:check
pnpm flow:check
```

For Next.js development diagnostics:

```bash
pnpm mcp:next
```

The development server must be running when connecting the MCP bridge.

### Browser development

For changes to visual components or interactions:

1. Start the application using `pnpm dev` or `pnpm --filter web dev:app`.
2. Open the affected page in a browser.
3. Verify interactions and relevant loading, empty and error states.
4. Check responsive behavior and keyboard accessibility.
5. Inspect runtime and browser console errors.
6. Use Next.js development MCP diagnostics when available.
7. Run the relevant automated checks.
8. Report actual verification results and limitations.

A successful build does not automatically establish correct visual behavior.

## Included examples and configuration

The starter contains fictional Acme data and replaceable examples.

The GenUI demonstration is available at `/genui-demo`.

The site consultant uses `POST /api/chat`.

The read-only consultant MCP integration uses `/api/mcp`.

These are example capabilities, not required business-product features.

Optional model-backed examples can use:

- `AI_GATEWAY_API_KEY`
- `GENUI_MODEL`
- `CONSULTANT_MODEL`

The example consultant MCP may use `CONSULTANT_MCP_BEARER` when exposed outside trusted local development.

Use the actual environment variable examples defined under `apps/web`.

Never commit secrets.

The two MCP responsibilities are distinct:

- `pnpm mcp:next` enables development diagnostics for coding agents.
- `/api/mcp` provides an example application-facing MCP endpoint.

See [ADR 0010](adr/0010-site-consultant-chat-and-mcp.md).

## Agent skills

Flow Starter includes a versioned manifest of reusable development skills.

Restore project skills with:

```bash
pnpm skills:install
```

List available skills with:

```bash
pnpm exec skills list
```

Update them deliberately with:

```bash
pnpm skills:update
```

The manifest is stored in `skills-lock.json`.

Coding agents should use the smallest relevant set of skills for each task.

Skill availability does not guarantee execution or correctness.

## Adopting Flow Starter

When creating a product from this repository:

1. Replace the root README with your product identity and description.
2. Define your product in PRODUCT.md.
3. Define the user experience in DESIGN.md.
4. Replace fictional data and optional demonstrations as needed.
5. Configure the integrations required by the product.
6. Preserve relevant architectural decisions.
7. Extend the application using the existing React and capability boundaries.
8. Use task-specific agent documentation and skills.
9. Verify the resulting application before delivery.

The objective is simple:

**Start with a sound architecture. Spend your effort building the product.**
