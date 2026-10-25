# Flow Factory

An agentic product-development environment: [Flow](README.md) methodology and Agent Skills, an opinionated reusable application foundation, isolated parallel execution (`pnpm --dir .agents worktrees`), product and technical documentation, evaluation harnesses, and user-invoked workflow improvement—not a permanently running reflection agent.

## Mission

**Make the architectural decisions once, so developers and agents can focus on building the product.**

Flow Factory provides a selected technical architecture, reusable capabilities, agent-oriented development tools, documentation conventions, and the Flow engineering workflow.

It is technology-opinionated and business-domain-agnostic: adopters inherit optional foundation capabilities and define their own product, users, domain, and experience. GenUI, MCP, authentication, and database features are available when a product needs them—not requirements for every new application.

## Goals

Accelerate delivery, build agent-first capabilities with host-enforced boundaries, keep a cohesive Vercel-aligned stack, maintain [Fractal React Architecture](decisions/adr/0009-react-nextjs-fractal-architecture.md), document for agents with progressive disclosure, support [controlled GenUI](decisions/adr/0003-genui-openui-foundation.md), improve the agentic developer experience, enable reliable delivery workflows, and remain reusable across products. Rationale and trade-offs: [ADR 0001](decisions/adr/0001-agentic-architecture.md).

## What the factory provides

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

- `apps/web` (product starter) — the only product application ([ADR 0014](decisions/adr/0014-web-only-product-application.md)).
- `@repo/genui`, `@repo/db` (Drizzle baseline; GenUI demo does not require a database), `@repo/ui`.
- Bounded HTTP inputs, fail-closed production rate limits, host-owned action policies.
- Flow workflow, skills manifest, `flow:check`, and React architecture checks.

Foundation capabilities are not a claim that every adopter application is production-ready. Current boundaries: [architecture.md](architecture.md).

## Selected future integrations

Eve, Better Auth runtime, product tables and tenant isolation, shared authorized operations, MCP Apps, isolated preview workflows, and the `/dev` workspace remain architectural direction until an adopter ships them. Direction: [architecture.md](architecture.md) §7.

## How Flow works

**Explore → Specify → Plan → Build → Review → Ship**

- [Human introduction](README.md)
- [Operational contract](flow.md) — documentation ownership, naming, and workflow behavior

Flow defines how work is organized. Flow Factory provides the selected technical architecture and tooling.

### Decision narrative

Read in this order to understand **why** the starter looks the way it does. Preserve original decision IDs and dates.

| Stage | Document | Status | Role |
| --- | --- | --- | --- |
| **Explore** | [20261017-voice-surfaces.md](research/20261017-voice-surfaces.md) | Historical | Evidence → [ADR 0004](decisions/adr/0004-voice-delegates-to-eve.md) |
| **Explore** | [20261020-generative-ui.md](research/20261020-generative-ui.md) | Historical | Landscape survey |
| **Explore** | [20261024-genui-json-vs-openui.md](research/20261024-genui-json-vs-openui.md) | Historical | Evidence → [ADR 0003](decisions/adr/0003-genui-openui-foundation.md) |
| **Explore** | [20261024-genui-extraction-inventory.md](research/20261024-genui-extraction-inventory.md) | Historical | Extraction evidence only |
| **Specify** | [PDR 0001](decisions/pdr/0001-agnostic-api-first.md) | Accepted | Product-engineering principles |
| **Specify** | [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md) | Adopter templates | Not starter decisions |
| **Plan** | [ADR 0001](decisions/adr/0001-agentic-architecture.md) | Accepted | Foundational stack (supersedes [0007](decisions/adr/0007-monorepo-vercel-stack.md), [0008](decisions/adr/0008-monorepo-turborepo-pnpm.md)) |
| **Plan** | [ADR 0009](decisions/adr/0009-react-nextjs-fractal-architecture.md) | Accepted | React and Next.js |
| **Plan** | [ADR 0003](decisions/adr/0003-genui-openui-foundation.md) | Accepted | GenUI representation |
| **Plan** | [ADR 0002](decisions/adr/0002-vercel-ai-sdk-for-tier-3.md) | Accepted | Tier-3 model surface |
| **Plan** | [ADR 0012](decisions/adr/0012-flow-and-web-applications.md) | Superseded by ADR 0014 | Historical two-app split |
| **Plan** | [ADR 0014](decisions/adr/0014-web-only-product-application.md) | Accepted | Web-only product application |
| **Plan** | [ADR 0010](decisions/adr/0010-site-consultant-chat-and-mcp.md) | Accepted | Flow Agent chat and MCP |
| **Plan** | [ADR 0011](decisions/adr/0011-api-and-agent-security-boundaries.md) | Accepted | Public API and agent boundaries |
| **Plan** | [ADR 0004](decisions/adr/0004-voice-delegates-to-eve.md) | Accepted, not implemented | Voice direction |
| **Plan** | [ADR 0005](decisions/adr/0005-workspace-stays-at-dev.md) | Accepted, not implemented | Workspace route |
| **Plan** | [ADR 0006](decisions/adr/0006-external-invocation-is-read-only.md) | Accepted, partial | External invocation |
| **Build** | [genui.md](specs/genui.md), code under `apps/` and `packages/` | Current | Implementation contracts |
| **Review** | [security-model.md](security/security-model.md) | Current | Implemented security boundaries |
| **Ship** | [architecture.md](architecture.md), [product ARCHITECTURE.md](../../ARCHITECTURE.md) | Current | Factory vs product architecture |

Full Factory ADR index: [decisions/adr/](decisions/adr/).

## Documentation map

| Need | Document |
| --- | --- |
| Agent entrypoint | [AGENTS.md](../../AGENTS.md) |
| Why a decision was made | Decision narrative (above) |
| Inherited Factory architecture | [architecture.md](architecture.md) |
| Product architecture (starter) | [ARCHITECTURE.md](../../ARCHITECTURE.md) |
| Security | [SECURITY.md](../../SECURITY.md), [security model](security/security-model.md) |
| Workflow | [flow.md](flow.md) |
| GenUI contracts | [specs/genui.md](specs/genui.md) |
| Product and design (adopter) | [PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md) |
| Browser verification | [verification.md](operations/verification.md) |
| Parallel worktrees | [worktrees.md](operations/worktrees.md) |
| Adaptive delegation | [delegation.md](operations/delegation.md) |

Do not read every ADR or research file by default.

## Adopting Flow Factory

Bootstrap from `main`:

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/gaboesquivel/flow-factory/main/.agents/tooling/setup/install.sh)"
```

The installer configures project identity, generates a product-focused README, customizes `PRODUCT.md` (while preserving the baseline `DESIGN.md` contract), removes bootstrap-only tooling and evaluator-only assessment fixtures, and creates a fresh Git history. It does not run `pnpm install`.

After installation:

1. Run `pnpm setup` and `pnpm dev` for local development.
2. Evolve `PRODUCT.md`, `DESIGN.md`, and `ARCHITECTURE.md` as you explore and build the product.
3. Replace starter homepage copy and add routes as the product takes shape.
4. Configure required integrations; preserve relevant ADRs and PDRs.
5. Extend `apps/web` using existing React and capability boundaries.
6. Verify before delivery (`pnpm qa`, [verification.md](operations/verification.md) for UI).

## Foundation development

```bash
pnpm install
pnpm setup:env
pnpm dev
```

`pnpm setup:full` adds skills, secret scanners, Portless, DeepSec, and Playwright.

```bash
pnpm qa
pnpm ci:local
pnpm security:check
pnpm --dir .agents check
```

`pnpm mcp:next` connects Next.js development diagnostics while the dev server is running.

UI verification: [verification.md](operations/verification.md) — `https://web.localhost` by default (`pnpm dev`), or `https://<portless-name>.localhost` after bootstrap.

## Examples

- Product starter: `pnpm dev` → `apps/web`.
- Environment templates: `apps/web/.env.example`. When you add compose, chat, or MCP routes, follow [security model](security/security-model.md) and [ADR 0011](decisions/adr/0011-api-and-agent-security-boundaries.md).
- `pnpm mcp:next` is Next.js dev diagnostics only, not a product MCP endpoint.

## Agent skills

```bash
pnpm skills:install
pnpm exec skills list
pnpm skills:update
```

Manifest: `.agents/skills-lock.json`. Install with `pnpm --dir .agents skills:install`. Use the smallest relevant skill set per task ([skills.md](operations/skills.md)).
