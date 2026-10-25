# Spec: Feature Intelligence — AI UX patterns

**Last reviewed:** 2026-10-25  
**Status:** Current  
**Catalog:** [AI UX Playground — Patterns](https://www.aiuxplayground.com/patterns) (Agentic UX, Trust Scaffolding, Chat UX, Inputs/Outputs)  
**Contracts:** [journeys](./feature-intelligence-journeys.md) · [eve agent](./feature-intelligence-eve-agent.md) · [DESIGN.md](../../DESIGN.md)

FI is **structured product UI first**; the **eve operator** and **ask-only `/chat`** must still follow the same interaction principles so agent surfaces feel as deliberate as the web app.

---

## Framework fit

| Playground framework | FI use |
| --- | --- |
| **Agentic UX** | eve tools mutate state; authority is bounded by human confirmation policy below. |
| **Trust Scaffolding** | Request ids, transparency steps, metrics sample sizes, no invented data. |
| **Chat UX** | Ask-only `/chat` only; primary workflows are not free-form chat. |

---

## Pattern map (adopted for MVP)

Patterns are **named from the catalog** for spec traceability. Implement the **behavior** in web UI, agent narration, or both.

| Pattern | Surface | FI behavior |
| --- | --- | --- |
| [Progressive disclosure](https://www.aiuxplayground.com/patterns) | Web J1–J5, eve | Summary first; brief, transparency, and harness detail only when persona or user asks. |
| [Skeleton screens](https://www.aiuxplayground.com/patterns) | Web `/triage` | Queue shape while loading (journeys UI detail). |
| [Processing time estimates](https://www.aiuxplayground.com/patterns) | Web submit, eve | Copy: “Usually 10–20 seconds” + **stage labels** tied to harness (below). |
| [Human in the loop](https://www.aiuxplayground.com/patterns) | Web confirm, eve | No `confirm_request` / `set_disposition` without explicit user approval in channel. |
| [Failure disclosure](https://www.aiuxplayground.com/patterns) | Web, eve, harness | Say what failed; offer degraded path (manual confirm) or read-only fallback. |
| [Citations](https://www.aiuxplayground.com/patterns) | eve, detail UI | Cite **FR-xxx** ids and support counts from tool output only. |
| [Chain of thought](https://www.aiuxplayground.com/patterns) (light) | eve, transparency | Summarize evaluation **steps** from `triage_steps` / tool payload—not raw model reasoning. |
| [Follow-up chips](https://www.aiuxplayground.com/patterns) | eve, `/chat` | End turns with 2–3 **suggested next actions** (plain text bullets). |
| [Prompt starters](https://www.aiuxplayground.com/patterns) | `/chat` empty state | 3–4 example questions about FI workflows and metrics. |
| [Streaming](https://www.aiuxplayground.com/patterns) | `/chat` | Token streaming via AI SDK; no tool calls. |
| [Response refinement](https://www.aiuxplayground.com/patterns) | `/chat` (v2) | Optional “shorter / more detail” — **deferred** unless time remains. |
| [Feedback](https://www.aiuxplayground.com/patterns) | Web, chat (v2) | Thumbs on ask-only replies — **deferred**; disposition is the PM feedback loop. |
| [Granular consent](https://www.aiuxplayground.com/patterns) | eve (v2) | Per-tool approval for `merge`/`decline` — optional `defineWorkflowTool`; MVP uses explicit chat confirmation. |
| [Can’t do this / draft instead](https://www.aiuxplayground.com/patterns) | eve | If tool missing or policy blocks mutation, offer read-only alternative (search, summarize queue). |

**Out of scope (MVP):** Generative UI in chat, live cost meters, voice, shared session links, memory scope toggles.

---

## Triage progress feedback (shared web + agent)

Host-owned stages from [triage harness](./feature-intelligence-triage-harness.md). UI and agent **must use the same labels** (order may skip when short-circuited).

| Stage | User-facing label             | When                           |
| ----- | ----------------------------- | ------------------------------ |
| T0    | Checking for similar requests | Lexical retrieve               |
| T1    | Matching theme                | Deterministic theme hit        |
| T2    | Classifying request           | Jev / decide step              |
| T3    | Drafting decision summary     | `generateObject` synthesis     |
| Done  | Ready for your review         | `pending_confirm` or published |

**Web:** Advance label on server-reported step or timed fallback during single server action (no fake sub-step animation).  
**Eve:** Before `submit_request`, one line with estimate + stages; after tool returns, one-line “Completed in {duration}” if `triage_steps` includes durations.

---

## Eve operator — response contract

Every **user-visible turn** after tools (or when proposing action) should follow:

1. **Headline** — outcome in one or two sentences (plain language).
2. **Evidence** — bullet list: request ids, theme, support count, queue position (from tools only).
3. **Progressive detail** — optional `### Details` section: problem one-liner, duplicate candidates, brief excerpt (truncate ~3 lines).
4. **Human gate** — explicit question before mutations: “Reply **confirm** to publish” / “Reply **approve** with edits to record disposition”.
5. **Follow-ups** — `**Next:**` with 2–3 short suggestions (e.g. “Show triage queue”, “Search CSV export”, “Open FR-003”).

**Anti-patterns**

- Wall of JSON or full brief before headline.
- Calling `confirm_request` or `set_disposition` in the same turn as `submit_request` without user approval.
- Inventing ids, metrics, or evaluation steps.
- Claiming triage is done while tool is still pending.

---

## Ask-only `/chat` — response contract

| Pattern | Implementation |
| --- | --- |
| Prompt starters | Empty thread: 3–4 `Button` or link chips to example prompts (product + metrics). |
| Progressive disclosure | Short answer first; “More detail” only if user asks or answer needs it. |
| Failure disclosure | Model errors: “Couldn’t reach the model” + retry; never pretend to run FI tools. |
| Streaming | `streamText`; show stop control if SDK supports it in UI. |
| Trust | State clearly: “I can’t change requests from this chat—use Submit or the FI agent.” |

System prompt must embed the **boundary** above and point to human routes (`/requests/new`, `/triage`).

---

## Acceptance (pattern slice)

| ID | Criterion |
| --- | --- |
| UX-1 | Web submit loading shows stage label + time estimate copy. |
| UX-2 | Eve `instructions.md` enforces read → propose → confirm before publish/disposition. |
| UX-3 | Eve eval or manual script: after `submit_request`, model does not call `confirm_request` without user confirmation turn. |
| UX-4 | `/chat` system prompt + empty state include prompt starters and no-tools boundary. |
| UX-5 | Tool failure surfaces user-visible message with fallback action (search / retry). |

---

## Changelog

- **v1** — Pattern map, triage stage labels, eve and chat response contracts.
