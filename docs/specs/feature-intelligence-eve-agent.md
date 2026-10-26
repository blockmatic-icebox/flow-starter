# Spec: Feature Intelligence — eve agent

**Last reviewed:** 2026-10-25  
**Status:** Current  
**Parent:** [feature-intelligence.md](./feature-intelligence.md) · [initiative](../initiatives/feature-intelligence.md)  
**Framework:** [eve](https://eve.dev/docs) (filesystem-first durable agent; Node 24+)

## Purpose

Product teams are not only humans in a browser—**support bots, PM copilots, and coding agents** need the same feature-intelligence capabilities without duplicating business logic in prompts. This spec defines the **eve root agent** that performs FI operations through **typed tools** backed by a shared domain package.

**Non-goal:** The in-app **starter chat** is **ask-only** (Q&A). It does **not** call FI mutation tools or replace this agent. See [§ Starter ask-only chat](#starter-ask-only-chat).

Aligns with [Factory PDR 0001 — capability-first, agent-ready](../../.agents/flow/decisions/pdr/0001-agnostic-api-first.md) and [ADR 0011 — API and agent security boundaries](../../.agents/flow/decisions/adr/0011-api-and-agent-security-boundaries.md).

---

## Monorepo layout

```text
meta-cto/
├── agent/                      # eve root agent (FI operations)
│   ├── instructions.md
│   ├── agent.ts                # model + optional defineAgent config
│   └── tools/                  # one file per tool slug
├── packages/fi/                # @repo/fi — domain capabilities (no React)
├── apps/web/                   # Human UI + ask-only /api/chat; eve/next proxy in dev/deploy
└── packages/db/                # Drizzle schema (shared)
```

**Decided**

- **Single root agent** at repository-root `agent/` (not `apps/web/agent/`), integrated via `eve/next` in `apps/web/next.config.ts` with `eveRoot: "../.."` per [eve project structure](https://eve.dev/docs/project-structure.md).
- Tools **import `@repo/fi`** only; no SQL or Drizzle inside `agent/tools/*`.
- Human pages and server actions in `apps/web` also call `@repo/fi` (same contracts as tools).

**Assumed**

- Assessment runs agent via `pnpm` script (`eve dev` or `dev:all` with web); terminal UI optional for demo voiceover on agent tools (not required in-app).
- Production deploy: Vercel contributes web + eve services together when using `eve/vercel` or `eve/next` (Plan details).

---

## Agent role (`agent/instructions.md`)

**Name:** Feature Intelligence operator (internal slug: `fi-operator`)

**Mission:** Help product teams turn unstructured feature requests into **decision-ready artifacts** and **recorded dispositions**—consolidating duplicates, articulating underlying problems, and preparing briefs. The agent **recommends**; humans (or explicit caller policy) **commit** dispositions.

**Behavior**

- Prefer **read → analyze → propose** before mutating state.
- On submit-like intents, run triage and present structured preview; do not skip duplicate search.
- When setting disposition, require **rationale**; for `merge`, require **target request id**.
- Cite request ids and support counts when recommending priority.
- Refuse to bypass transparency: after triage, mention that evaluation steps are stored on the request.
- Do not invent requests, votes, or dispositions not returned by tools.

**AI UX patterns** ([catalog](https://www.aiuxplayground.com/patterns), [FI mapping](./feature-intelligence-ai-ux-patterns.md)):

| Pattern | Agent requirement |
| --- | --- |
| Progressive disclosure | Headline + evidence first; details optional. |
| Progress feedback | Narrate triage stages + ~10–20s estimate before `submit_request`. |
| Human in the loop | No `confirm_request` / `set_disposition` without explicit user approval in channel. |
| Failure disclosure | Tool errors → what failed + read-only or retry path. |
| Citations | FR-xxx and counts from tools only. |
| Follow-up chips | 2–3 suggested next actions at end of turn. |

Canonical turn shape and acceptance **UX-1–UX-5** live in the patterns spec; `agent/instructions.md` is the runtime copy.

**Out of scope for this agent**

- General product chit-chat (use starter ask-only chat).
- Roadmap execution, Jira/Linear writes (future connections).

---

## Domain package (`@repo/fi`)

Capabilities are **plain async functions** with Zod-validated inputs/outputs, shared by web and eve.

| Capability | Used by |
| --- | --- |
| `searchRequests` | Web list, tool `search_requests` |
| `getRequest` | Web detail, tool `get_request` |
| `createDraftAndTriage` | Web submit, tool `submit_request` (runs [triage harness](./feature-intelligence-triage-harness.md)) |
| `confirmRequest` | Web confirm, tool `confirm_request` |
| `supportRequest` | Web support, tool `support_request` |
| `listTriageQueue` | Web `/triage`, tool `list_triage_queue` |
| `setDisposition` | Web PM, tool `set_disposition` |
| `getInsights` | Web `/insights`, tool `get_insights` |

Errors: structured `{ code, message, details? }` — tools map to thrown errors eve can surface.

---

## Tool catalog (`agent/tools/`)

Each tool: `defineTool` from `eve/tools`, Zod `inputSchema`, optional `outputSchema`, `execute` → `@repo/fi`.

| File slug | Description (model-facing) | Mutates | Notes |
| --- | --- | --- | --- |
| `search_requests` | Search/filter published requests by text, theme, source | No | Default limit 20 |
| `get_request` | Full record + duplicate candidates + transparency | No |  |
| `submit_request` | Create draft and run AI triage pipeline | Yes | Returns pending_confirm payload |
| `confirm_request` | Publish after problem edit | Yes |  |
| `support_request` | Add support for a request | Yes | Uses `supporterKey` from ctx or input |
| `list_triage_queue` | Published items without disposition | No |  |
| `set_disposition` | Record PM disposition + rationale | Yes | `availableInSubagents: false` |
| `get_insights` | North-star metrics per [FI metrics spec](./feature-intelligence.md#product-metrics-first) | No |  |

### `set_disposition` — human judgment

```ts
// Policy in tool execute (host-owned, not model flags)
inputSchema: z.object({
  requestId: z.string().uuid(),
  disposition: z.enum(["merge", "monitor", "decline", "needs_discussion"]),
  rationale: z.string().min(1),
  mergeTargetId: z.string().uuid().optional(),
});
```

**Assessment:** No interactive approval UI in eve; **rationale required** in schema enforces deliberate action. **Plan option:** `defineWorkflowTool` + approval step for `merge`/`decline` if time remains.

### `submit_request` — ends turn optional

Return structured triage preview; do **not** set `endsTurn: true` so the model can summarize for the user in the same turn.

### Deferred tools (optional)

If tool count grows, mark `get_insights` as `deferred: true` per eve docs.

---

## Sessions and channels

| Surface | Assessment slice |
| --- | --- |
| **Terminal** | `eve dev` — demo agent tool calls |
| **HTTP** | `/eve/v1/...` on deployed app (eve default) |
| **In-app eve web channel** | **Not in scope** — chat UI is ask-only, not full eve channel |
| **MCP** | **Live** — `POST /api/mcp` (Streamable HTTP), eight tools (assessment demo-open) — [agentic discoverability spec](./feature-intelligence-agentic-discoverability.md) + [ADR 0005](../adr/0005-fi-agentic-discoverability-and-mcp.md) |

Durable sessions: use eve defaults so a PM copilot can continue a triage conversation across turns.

---

## Starter ask-only chat

**Route:** `apps/web/app/chat/page.tsx` (or `/` sidebar later)  
**API:** `apps/web/app/api/chat/route.ts`

| Aspect | Spec |
| --- | --- |
| **Model** | AI SDK `streamText` with **`@ai-sdk/anthropic`** and `ANTHROPIC_API_KEY` (not gateway) — [ADR 0003](../adr/0003-feature-intelligence-model-providers.md) |
| **Default model** | `FI_CHAT_MODEL` → `claude-sonnet-4-20250514` |
| **Reference** | Historical Flow demo `apps/flow` chat API ([ADR 0010](../../.agents/flow/decisions/adr/0010-site-consultant-chat-and-mcp.md)); port route shape to `apps/web/app/api/chat/route.ts` |
| **Tools** | **None** — ask-only |
| **System prompt** | Explains Feature Intelligence product, metrics, and workflows; **prompt starters** on empty state; progressive disclosure in answers; must state **no FI tools** and no mutations |
| **Patterns** | [feature-intelligence-ai-ux-patterns.md](./feature-intelligence-ai-ux-patterns.md) — chat column only |
| **Data access** | No live DB reads in v1 (avoids duplicating agent); optional later: RAG on public docs only |
| **Purpose** | Assessment: show dual surfaces (human product + conversational help) without conflating chat with triage |

**Build sketch (`route.ts`):**

```ts
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: anthropic(
      process.env.FI_CHAT_MODEL?.trim() ?? "claude-sonnet-4-20250514"
    ),
    system: fiAskOnlySystemPrompt,
    messages,
  });
  return result.toUIMessageStreamResponse();
}
```

**Explicit separation**

```text
User in /chat     →  Q&A about the product (no mutations)
User in /requests →  Human UI + server actions → @repo/fi
External agent    →  eve HTTP/session → tools → @repo/fi
```

---

## Security (assessment → production path)

| Layer | Assessment | Production direction |
| --- | --- | --- |
| eve HTTP | Open on localhost | Bearer token / eve auth per deployment docs |
| Tool inputs | Zod bounded (length limits on text) | Same + rate limits |
| `set_disposition` | Callable by any session holder | Tie to auth identity + role |
| Chat API | No tools | Rate limit; no secrets in system prompt |

Never accept disposition policy from model output (ADR 0011).

---

## Observability

- Use **Agent Runs** (Vercel) when deployed for optional demo segment on tool traces (external recording).
- Persist `triage_steps` on requests (human spec) for cross-surface transparency.

---

## Seed data (eve v1)

**Required before agent testing.** Deterministic fixture FR-001–FR-011, tool test matrix, and `pnpm --filter @repo/fi seed` — see [feature-intelligence-seed.md](./feature-intelligence-seed.md).

Quick check after seed:

```bash
pnpm --filter @repo/fi seed
npx eve dev   # from repo root after eve init
# list_triage_queue → 50 items; search_requests "CSV" → FR-001, FR-002
```

## Dependencies (Plan / Build)

0. **Seed wave** — schema migration + [seed spec](./feature-intelligence-seed.md) (blocks tool implementation).
1. `npx eve@latest init .` at repo root (add `eve`, `ai`, `zod` without clobbering monorepo).
2. Create `packages/fi` workspace package.
3. Wire `apps/web/next.config.ts` with `eve/next`.
4. Implement tools as thin wrappers.

**Node:** 24+ for eve (document in README; CI image may need bump in Plan).

### MVP tool surface

**Shipped (assessment + demo depth):** `search_requests`, `get_request`, `submit_request`, `list_triage_queue`, `set_disposition`, `get_insights`, `confirm_request`, `support_request` in `agent/tools/`. AG-2 terminal check remains manual; smoke suite covers AG-3, AG-7, queue count, search, **owned-row** confirm/monitor/merge (`confirm-after-approval`, `set-disposition-monitor`, `merge-disposition`).

---

## Acceptance criteria (agent slice)

| ID | Criterion |
| --- | --- |
| AG-1 | `eve info` discovers all FI tools from `agent/tools/`. |
| AG-2 | Terminal session: `submit_request` → `confirm_request` publishes a request visible in web UI. |
| AG-3 | `search_requests` returns seeded duplicate pair when queried with overlapping text. |
| AG-4 | `set_disposition` with merge requires `mergeTargetId` + rationale; reflected in web `/triage`. |
| AG-5 | `/api/chat` streams answers with **zero** tools registered. |
| AG-6 | No business logic duplicated between a tool and a server action (both call `@repo/fi`). |
| AG-7 | After `submit_request`, agent does not call `confirm_request` until user explicitly confirms (eval or scripted manual). |

---

## Testing

MVP: **eve eval** smoke suite + seed; web UI **manual only**. See [feature-intelligence-testing.md](./feature-intelligence-testing.md).

## Approval

**Current.** Build order: [docs/tasks/feature-intelligence.md](../tasks/feature-intelligence.md) waves 0→4. Ask-only `/chat` and `eve/next` are post-**G4** / cut-first per initiative.
