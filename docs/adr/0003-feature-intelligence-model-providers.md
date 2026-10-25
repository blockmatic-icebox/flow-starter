Date: 2026-10-25

# ADR 0003 — Feature Intelligence model providers

**Status:** Accepted

## Context

FI uses two AI surfaces with different credential and routing needs:

1. **Triage harness** (`@repo/fi`) — Jev `experimental_decide` (T2) and `generateObject` synthesis (T3).
2. **Ask-only `/chat`** (`apps/web`) — streaming product Q&A, no FI tools.

The monorepo already routes **GenUI tier-3** prose through **Vercel AI Gateway** when `AI_GATEWAY_API_KEY` is set ([`packages/genui/src/orchestration/model.ts`](../../packages/genui/src/orchestration/model.ts), Factory [ADR 0002](../../.agents/flow/decisions/adr/0002-vercel-ai-sdk-for-tier-3.md)). The historical **Flow demo** app (`apps/flow`, [ADR 0010](../../.agents/flow/decisions/adr/0010-site-consultant-chat-and-mcp.md)) used AI SDK **`streamText`** for in-app chat; that app was removed from the template ([ADR 0014](../../.agents/flow/decisions/adr/0014-web-only-product-application.md)), but the chat API pattern is the reference for FI `/chat`.

Local development already has **`ANTHROPIC_API_KEY`** for chat; triage/Jev should use **AI Gateway directly** (not the Anthropic provider SDK).

## Decision

| Surface | Provider | Credential | Model default |
| --- | --- | --- | --- |
| **Triage T2 (Jev)** | Vercel AI Gateway (`@ai-sdk/gateway`) | `AI_GATEWAY_API_KEY` | `typesafe-ai/jev` (`FI_DECISION_MODEL`) |
| **Triage T3 (synthesis)** | Same gateway | `AI_GATEWAY_API_KEY` | `anthropic/claude-sonnet-4.6` (`FI_SYNTHESIS_MODEL`) |
| **Ask-only `/chat`** | Anthropic provider (`@ai-sdk/anthropic`) | `ANTHROPIC_API_KEY` | `claude-sonnet-4-20250514` (`FI_CHAT_MODEL`) |

**Rules**

- Harness code **must not** call `@ai-sdk/anthropic` for Jev or synthesis; gateway model ids use the `provider/model` form (e.g. `typesafe-ai/jev`, `anthropic/claude-sonnet-4.6`).
- `/chat` **must not** require `AI_GATEWAY_API_KEY`; it uses direct Anthropic when `ANTHROPIC_API_KEY` is set.
- Eve operator sessions use the same `@repo/fi` harness (gateway); eve model for tool routing is separate from this ADR.
- Reference implementations: gateway helper in `@repo/fi` ([`packages/fi/src/ai/gateway.ts`](../../packages/fi/src/ai/gateway.ts)); chat route to mirror historical `apps/flow` `streamText` + UI streaming ([eve agent spec](../specs/feature-intelligence-eve-agent.md#starter-ask-only-chat)).

## Alternatives considered

- **Single gateway for chat and triage.** Rejected for assessment dev: Anthropic key already configured for chat; gateway reserved for Jev and gateway-routed Sonnet on triage.
- **Direct Anthropic for Jev.** Rejected; Jev is gateway-native (`typesafe-ai/jev`).

## Consequences

- `apps/web/.env.example` documents both keys and their scopes.
- CI stays keyless: harness unit tests mock T2/T3; chat tests skip or mock without `ANTHROPIC_API_KEY`.
- README assessment section lists both env vars.

## Related documents

- [docs/specs/feature-intelligence-triage-harness.md](../specs/feature-intelligence-triage-harness.md)
- [docs/specs/feature-intelligence-eve-agent.md](../specs/feature-intelligence-eve-agent.md)
- [ADR 0002 — Feature Intelligence architecture](./0002-feature-intelligence-architecture.md)
