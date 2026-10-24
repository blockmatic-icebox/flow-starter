Date: 2026-10-17

# ADR 004 — Voice delegates domain work to eve

**Status:** Accepted · October 17, 2026

## Context

Voice surfaces must not fork product logic. Users expect the same grounded answers and authorized actions whether they type or speak.

## Decision

When implemented, the speech model handles listening and presentation only. Grounded answers, tool use, and canvas commits stay on the same eve agent and shared actions as text. Builder’s integrated runtime and direct OpenAI Realtime remain alternatives that must pass Flow’s integration gates before replacing the eve Voice template approach.

## Consequences

- Voice is follow-on work under [PRODUCT.md](../../PRODUCT.md).
- See [ARCHITECTURE.md](../../ARCHITECTURE.md) §7 and [voice-surfaces research](../research/20261017-voice-surfaces.md).
- The site shell sidebar ([ADR 0010](0010-site-consultant-chat-and-mcp.md)) uses transcription and AI SDK chat first; eve voice templates remain the path for durable workspace voice later.
