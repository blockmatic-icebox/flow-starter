Date: 2026-10-17

# ADR 0004 — Voice delegates domain work to eve

**Status:** Accepted

## Context

**Not implemented.** Optional capability for adopters who add voice. Voice surfaces must not fork product logic. Users expect the same grounded answers and authorized actions whether they type or speak.

## Decision

When implemented, the speech model handles listening and presentation only. Grounded answers, tool use, and canvas commits stay on the same eve agent and shared actions as text. Builder’s integrated runtime and direct OpenAI Realtime remain alternatives that must pass Flow’s integration gates before replacing the eve Voice template approach.

## Alternatives considered

- **Separate voice-only business logic.** Rejected; duplicates authorization and grounding.
- **OpenAI Realtime as the default executor.** Not selected until integration gates pass; eve voice templates remain the preferred path.

## Consequences

- Product scope for voice belongs in [PRODUCT.md](../../../../PRODUCT.md). Technical direction stays in [ARCHITECTURE.md](../../../../ARCHITECTURE.md) §7.
- The Flow Agent sidebar ([ADR 0010](0010-site-consultant-chat-and-mcp.md)) uses transcription and AI SDK chat first; eve voice templates remain the path for durable workspace voice later.

## Related documents

- [ARCHITECTURE.md](../../../../ARCHITECTURE.md) §7
- [docs/research/20261017-voice-surfaces.md](../../research/20261017-voice-surfaces.md)
- [ADR 0005 — Workspace at `/dev`](0005-workspace-stays-at-dev.md)
