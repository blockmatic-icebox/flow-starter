Date: 2026-10-24

# ADR 006 — External invocation is read-only for canvas

**Status:** Accepted

## Context

External coding clients and browser workspace users may share one eve agent, but session-bound canvas state must not leak or mutate across channels.

## Decision

When implemented, the same eve agent serves browser workspace users and external coding clients, but server tool policy limits external callers to cited answers and optional validated OpenUI specs. They cannot mutate browser canvases or infer selection from an open session. Machine credentials and channel auth enforce that boundary independently of prompts.

## Consequences

- Follow-on work under [PRODUCT.md](../../PRODUCT.md).
- See [ARCHITECTURE.md](../../ARCHITECTURE.md) §7.
