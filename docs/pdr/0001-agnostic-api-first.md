Date: 2026-10-24

# PDR 0001 — Product-agnostic, capability-first and agent-ready development

**Status:** Accepted

## Context

Flow Starter is a reusable foundation for creating different software products, not a product with a fixed business domain.

The starter should make it practical to build capabilities that can serve humans, applications, and agents without duplicating business logic for every interface.

Agent-agnostic development tools and agent-accessible product interfaces are related but different requirements.

This record describes the starter's product-engineering direction. It does not populate the next adopter's PRODUCT.md.

## Decision

Adopt a **product-agnostic, agent-agnostic development workflow and capability-first application approach**.

### Product-agnostic

The starter must not require a particular business domain, customer persona, company, brand, dataset, or product journey.

Examples and fixtures remain fictional and replaceable.

Product-agnostic means business-domain agnostic. Flow Starter itself is intentionally technology-opinionated: adoption includes Next.js, React, TypeScript, the selected agentic architecture, and the documented development conventions. It is not a generic framework-selection kit.

### Agent-agnostic development

The repository must work with different coding agents.

Use AGENTS.md and docs/workflow/flow.md as shared repository instructions. Do not require vendor-specific agent rules or a proprietary editor.

External skills may assist the workflow without controlling product intent or documentation ownership.

### Capability-first

Define important operations through clear contracts, inputs, outputs, validation, errors, and authorization boundaries.

Prefer reusable operations over business logic embedded exclusively in a page or agent prompt.

### API-first where appropriate

Provide machine-consumable interfaces for capabilities that need external consumers.

HTTP APIs are a primary supported interface, but not every internal function must become an HTTP endpoint.

Do not create public APIs without a consumer, security model, and reason to expose them.

### Agent-ready and MCP-ready

Consider agent consumers from the beginning when a capability is useful to automation or delegation.

Prefer typed operations, explicit permissions, structured errors, idempotency where appropriate, and observable execution.

MCP is a first-class integration option when interoperability with MCP hosts adds value. It is not mandatory for every project or internal operation.

Do not confuse supporting agents with allowing agents unrestricted authority.

### Human-first experience

Human interfaces must remain understandable, useful, accessible, and coherent.

Agent-oriented contracts do not justify neglecting interaction design or product experience.

### Lean implementation

Do not build all possible interfaces up front.

Create the smallest functional slice that proves the capability and expand the interfaces as actual consumers require them.

## Alternatives considered

### UI-bound business logic

Rejected as the default for reusable cross-channel operations because it leads to duplication and inconsistent authorization.

### HTTP endpoints for every internal operation

Rejected because it creates unnecessary exposure and maintenance cost.

### Mandatory MCP server for every project

Rejected because consumers and host support vary. MCP integration should be deliberate.

### Vendor-specific coding-agent instructions

Rejected as a requirement of the shared workflow. Editor-specific local configuration may be used individually without becoming part of the starter contract.

## Consequences

- Domain logic should remain appropriately separated from presentation.
- APIs and agent tools should reuse authorized operations where possible.
- Cross-channel operation consistency becomes a design and testing concern.
- Some adopters will not need voice, MCP, or public APIs.
- Security and permissions remain host-enforced rather than prompt-enforced.
- A reusable baseline should not imply every capability has been implemented.
- Documentation and implementation should express the same accepted boundaries.

## Related documents

- [docs/workflow/flow.md](../../docs/workflow/flow.md) — development workflow
- [AGENTS.md](../../AGENTS.md) — universal agent entrypoint
- [ARCHITECTURE.md](../../ARCHITECTURE.md) — technical boundaries
- [PRODUCT.md](../../PRODUCT.md) — adopter-owned product template
- [ADR 0001](../adr/0001-agentic-architecture.md) — foundational technology choices and rationale
- [ADR 006](../adr/0006-external-invocation-is-read-only.md) — planned external authorization boundary
