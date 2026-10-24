Date: 2026-10-24

# ADR 0010 — Site consultant chat and read-only MCP

**Status:** Accepted

## Context

Flow Starter needs a demonstrable agentic surface before eve, Better Auth, and the `/dev` workspace ship. External hosts (for example ChatGPT) and in-app users should receive the same grounded answers about how the starter is built. Voice input must not fork business logic or introduce a second executor.

## Decision

Ship a **site consultant** with two surfaces:

1. **In-app** — a right-hand chat sidebar on the site shell (all routes), using Vercel AI SDK UI streaming and AI Elements–style presentation (reasoning, tool status, speech input). Client-only page actions (`open-genui-demo`, `toggle-theme`) run through registered host actions, not through MCP.
2. **External** — a **read-only** MCP server (Streamable HTTP) exposing the same consultant tools. External callers cannot mutate the browser DOM or session canvas ([ADR 006](0006-external-invocation-is-read-only.md)).

**Agent-to-UI** is named **AG-UI** in product vocabulary. This slice implements that layer with the AI SDK UI message stream (tool and reasoning parts), not a separate CopilotKit or `@ag-ui/vercel-ai-sdk` runtime. MCP remains the interoperability surface for external agents.

Speech in the sidebar uses browser transcription (`SpeechInput` / Web Speech API) and optional AI Gateway–backed chat. The app does **not** embed OpenAI Realtime or GPT-Live. Eve, when added, must call the same consultant capabilities rather than duplicating them ([ADR 004](0004-voice-delegates-to-eve.md)).

## Consequences

- [ARCHITECTURE.md](../../ARCHITECTURE.md) §6 documents `/api/chat` and `/api/mcp`.
- [ADR 005](0005-workspace-stays-at-dev.md) still reserves the full workspace to `/dev`; the site sidebar is not that workspace.
- [ARCHITECTURE.md](../../ARCHITECTURE.md) §6 documents the implemented consultant chat and MCP surface.
- Wispr Flow desktop dictation may fill the composer; embedded Wispr API is out of scope until access is granted.
