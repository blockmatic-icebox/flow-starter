Date: 2026-10-24

# ADR 0006 — External invocation is read-only for canvas

**Status:** Accepted

## Context

**Not implemented** beyond the read-only Flow Agent MCP ([ADR 0010](0010-site-consultant-chat-and-mcp.md)). External coding clients and browser workspace users may share one eve agent, but session-bound canvas state must not leak or mutate across channels.

## Decision

When implemented, the same eve agent serves browser workspace users and external coding clients, but server tool policy limits external callers to cited answers and optional validated OpenUI specs. They cannot mutate browser canvases or infer selection from an open session. Machine credentials and channel auth enforce that boundary independently of prompts.

## Alternatives considered

- **Shared mutable canvas across external and browser channels.** Rejected; session and selection boundaries must not leak.
- **Prompt-only enforcement.** Rejected; policy belongs in server tool configuration.

## Consequences

- Further external invocation is adopter scope in [PRODUCT.md](../../../../PRODUCT.md). The boundary stays in [ARCHITECTURE.md](../../../../ARCHITECTURE.md) §7.
- Current MCP remains read-only per [ADR 0010](0010-site-consultant-chat-and-mcp.md) and [ADR 0011](0011-api-and-agent-security-boundaries.md).

## Related documents

- [ARCHITECTURE.md](../../../../ARCHITECTURE.md) §7
- [ADR 0010 — Flow Agent chat and MCP](0010-site-consultant-chat-and-mcp.md)
- [ADR 0011 — API and agent security boundaries](0011-api-and-agent-security-boundaries.md)
