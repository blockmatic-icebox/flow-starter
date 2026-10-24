Date: 2026-10-24

# ADR 0010 — Flow Agent chat and read-only MCP

**Status:** Accepted

## Context

Historical name: **site consultant**. Implemented as **Flow Agent** in `apps/flow` per [ADR 0012](0012-flow-and-web-applications.md).

Flow Starter needs a demonstrable agentic surface before eve, Better Auth, and the `/dev` workspace ship. External hosts (for example ChatGPT) and in-app users should receive the same grounded answers about how the starter is built. Voice input must not fork business logic or introduce a second executor.

## Decision

Ship **Flow Agent** with two surfaces:

1. **In-app** — a right-hand chat sidebar on the Flow experience (`apps/flow`), using Vercel AI SDK UI streaming (reasoning, tool status, speech input). Host UI actions stay client-side; they are not MCP tools.
2. **External** — a **read-only** MCP server (Streamable HTTP) exposing four grounded describe tools. External callers cannot mutate browser state ([ADR 0006](0006-external-invocation-is-read-only.md)).

**Agent-to-UI** is named **AG-UI** in product vocabulary. This slice implements that layer with the AI SDK UI message stream, not a separate CopilotKit or `@ag-ui/vercel-ai-sdk` runtime. MCP remains the interoperability surface for external agents.

Speech in the sidebar uses browser transcription (`SpeechInput` / Web Speech API) and optional AI Gateway–backed chat. The app does **not** embed OpenAI Realtime or GPT-Live. Eve, when added, must call the same consultant capabilities rather than duplicating them ([ADR 0004](0004-voice-delegates-to-eve.md)).

## Alternatives considered

- **MCP tools for host UI actions.** Rejected; UI actions stay client-side and host-controlled.
- **OpenAI Realtime in the sidebar.** Rejected for this slice; eve voice templates cover durable workspace voice later.

## Consequences

- [ARCHITECTURE.md](../../ARCHITECTURE.md) §6 documents `/api/chat` and `/api/mcp`.
- [ADR 0005](0005-workspace-stays-at-dev.md) still reserves the full workspace to `/dev`; the Flow Agent sidebar is not that workspace.
- Wispr Flow desktop dictation may fill the composer; embedded Wispr API is out of scope until access is granted.

## Related documents

- [ADR 0012 — Flow and web applications](0012-flow-and-web-applications.md)
- [ADR 0011 — API and agent security boundaries](0011-api-and-agent-security-boundaries.md)
- [docs/security/security-model.md](../security/security-model.md)
