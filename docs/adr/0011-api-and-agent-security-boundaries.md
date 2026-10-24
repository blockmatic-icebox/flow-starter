Date: 2026-10-24

# ADR 0011 — API and agent security boundaries

**Status:** Accepted

## Context

The starter exposes a public compose API, a consultant chat API, and a read-only MCP endpoint. Earlier behavior trusted the request hostname for local authentication and rate-limit exemptions, emitted GenUI envelopes before validation, and let an action invocation carry its own auth and approval flags. Those choices are unsafe once the same code runs outside a laptop.

Agents and browsers are consumers of host capabilities. They are not authorities for policy.

## Decision

HTTP and MCP adapters are untrusted boundaries. Every request is validated and bounded before execution. Production rate limits are enforced through distributed storage. Privileged action policies are registered by trusted application code, not supplied by model output or callers. GenUI is compiled and validated before rendering. Security controls are tested deterministically and enforced by automatic CI.

## Alternatives considered

- Keep hostname checks for local development. Rejected. A caller can set `Host` and `Origin`. `NODE_ENV` is the server's own signal.
- Rate-limit in process memory in production. Rejected. Instances would not share counters, and a Redis failure must not silently fall back to that memory.
- Let the model or the client mark an action as not requiring auth. Rejected. That flag is policy, and policy belongs to the host registry.
- Render partial OpenUI before the compiler accepts it. Rejected. The browser would present an untrusted document.

## Consequences

- Production MCP and rate limits fail closed until `APP_ORIGIN`, Redis, and either a bearer token or `CONSULTANT_MCP_PUBLIC_READ_ONLY=1` are configured.
- Development keeps a memory counter and unauthenticated MCP on loopback and `flow.localhost`.
- The public demo stays unauthenticated. Identity, tenant isolation, and a real approval workflow remain adopter work.
- Implementation detail lives in [the security model](../security/security-model.md), not in further ADRs, unless a later decision changes this boundary.

## Related documents

- [SECURITY.md](../../SECURITY.md)
- [docs/security/security-model.md](../security/security-model.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [ADR 0006](0006-external-invocation-is-read-only.md)
- [ADR 0010](0010-site-consultant-chat-and-mcp.md)
