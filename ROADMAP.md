# Roadmap

Current delivery status and implementation sequence for the Flow Starter baseline.

This document describes the starter's development, not the adopter's product roadmap. Projects created from the starter should replace or adapt it to their own priorities.

Technical constraints and system architecture belong in [ARCHITECTURE.md](ARCHITECTURE.md). Product requirements belong in [PRODUCT.md](PRODUCT.md). The workflow governing changes belongs in [docs/workflow/flow.md](docs/workflow/flow.md).

## Shipped baseline

- `@repo/genui`: OpenUI Lang contracts, compiler, controlled and declarative composition, React adapter, and fictional Acme fixtures.
- `POST /api/genui/compose`: NDJSON streaming with optional local rate limits.
- `/genui-demo`: web integration example.
- Site consultant: right-hand chat sidebar on the site shell, `POST /api/chat`, read-only `GET|POST|DELETE /api/mcp` ([ADR 0010](docs/adr/0010-site-consultant-chat-and-mcp.md)).
- Optional AI Gateway-backed tier-3 answers and consultant chat, with a grounded deterministic fallback when credentials are absent.
- `@repo/db`: Drizzle schema, `postgres.js` client, committed migrations, and `drizzle-kit check` in `pnpm qa`.
- Neon Local via `docker-compose.yml` and `pnpm db:start` / `db:migrate` / `db:ping` (requires Neon credentials and Docker).
- Security and workspace hygiene: gitleaks, OSV, knip, sherif, `pnpm security:check`, and expanded pre-commit gates.
- Local quality commands and manual GitHub Actions workflows (CI and Security workflows; PR title check active on GitHub).
- Flow workflow documentation and agent skills integration.

"Shipped" here means implemented in the starter, not production validated for an adopter's application.

## Planned work

| Order | Capability | Status | Verification goal |
| --- | --- | --- | --- |
| 1 | Foundation integration spike | Planned | Eve, authentication, persistence, streaming, cancellation, authorization and deployment work together in one vertical slice |
| 2 | `/dev` workspace | Planned | Conversation, selection context, responsive layout and validated result surfaces function together |
| 3 | Shared-action slice | Planned | A human and an agent can invoke the same authorized action with consistent validation and results |
| 4 | Grounded explorer | Planned | Bounded retrieval produces source-backed answers and validated presentation |
| 5 | Adoption proof | Planned | A fork can replace product context and fixtures, extend the system, pass the checks and deploy a working slice |

A planned integration must not be presented as existing functionality.

## Later candidates

- Authenticated external invocation beyond the public read-only MCP slice, subject to [ADR 006](docs/adr/0006-external-invocation-is-read-only.md).
- Eve workspace voice delegation, subject to [ADR 004](docs/adr/0004-voice-delegates-to-eve.md).
- MCP Apps host harness and Eve `defineEval` suites (browser fixture lab and consultant MCP protocol tests ship; see [docs/specs/genui/readme.md](docs/specs/genui/readme.md#tests)).

## Maintenance rules

- This is the sole document for ordered milestones and their current status.
- Do not copy the milestone table into ARCHITECTURE.md, AGENTS.md, or README.md.
- Keep technical design and constraints in ARCHITECTURE.md.
- Put feature-specific scope and tasks in the appropriate initiative when one exists.
- Update status only after verifying the relevant implementation.
- Do not add dates, ownership, metrics, or delivery commitments without evidence.
- Replace starter-specific milestones when adopting this template for a new product.
