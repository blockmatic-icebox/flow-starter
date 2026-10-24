# Roadmap

Current delivery status and implementation sequence for the Flow Starter baseline.

This document describes the starter's development, not the adopter's product roadmap. Projects created from the starter should replace or adapt it to their own priorities.

Technical constraints and system architecture belong in [ARCHITECTURE.md](ARCHITECTURE.md). Product requirements belong in [PRODUCT.md](PRODUCT.md). The workflow governing changes belongs in [docs/workflow/flow.md](docs/workflow/flow.md).

## Shipped baseline

- `@repo/genui`: OpenUI Lang contracts, compiler, controlled and declarative composition, React adapter, and fictional Acme fixtures.
- `POST /api/genui/compose`: NDJSON streaming with optional local rate limits.
- `/genui-demo`: web integration example.
- Optional AI Gateway-backed tier-3 answers, with a grounded fallback when credentials are absent.
- Local quality commands and manual GitHub Actions workflows.
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

- External read-only invocation, subject to [ADR 006](docs/adr/0006-external-invocation-is-read-only.md).
- Voice delegation, subject to [ADR 004](docs/adr/0004-voice-delegates-to-eve.md).
- Additional browser, MCP Apps, and generated-interface quality testing where actual adopter needs justify it.

## Maintenance rules

- This is the sole document for ordered milestones and their current status.
- Do not copy the milestone table into ARCHITECTURE.md, AGENTS.md, or README.md.
- Keep technical design and constraints in ARCHITECTURE.md.
- Put feature-specific scope and tasks in the appropriate initiative when one exists.
- Update status only after verifying the relevant implementation.
- Do not add dates, ownership, metrics, or delivery commitments without evidence.
- Replace starter-specific milestones when adopting this template for a new product.
