# Human-readable surfaces

Flow distinguishes **where** the user interacts:

| Surface | Examples | GenUI / UI contract |
| --- | --- | --- |
| **Coordinator host** | Cursor chat, Plan review, structured question tools | Host-native structured UI when available—not product code |
| **Product app** | `apps/web` routes the team ships | [`@repo/genui`](../specs/genui.md) and validated OpenUI Lang ([ADR 0003](../decisions/adr/0003-genui-openui-foundation.md)) |

Use the least presentation that fits the task. Do not force forms or charts for one-line answers.

## Chat prose (coordinator)

The human-facing Cursor conversation is not a tasks file. Write so someone who has not memorized the checklist can follow you.

| Context | Prefer | Avoid as the main explanation |
| --- | --- | --- |
| Progress, blockers, “what’s left to ship” | Outcomes and capabilities in plain language (“export metrics”, “finish disposition APIs”) | Gate/task algebra (`G4 = T-3-9 + T-4-4`), bare task or gate ids without explanation, or wave-only labels |
| Traceability | Link to `docs/tasks/<slug>.md` or the initiative; name the section if helpful | Dumping id tables copied from the tasks doc |
| Task reports and **Next** | One concrete recommended action described in words | A list of ids with no translation |

**Examples**

- **Avoid:** “Blocked on G4; need T-4-4 before T-4-3.”
- **Prefer:** “Ship is blocked until the security review checklist and deployment runbook are done. The review item is still open; I can do the runbook next.”

Internal ids remain appropriate in repository artifacts ([tasks-documents.md](tasks-documents.md)), commit subjects when the team uses them, and worker briefs ([worktrees.md](worktrees.md)).

## Coordinator host (session UI)

When the host exposes structured or visual affordances, **prefer them over walls of prose** for the same content.

| Intent | Prefer | Avoid when structured UI exists |
| --- | --- | --- |
| Choose among options that change product decisions | Structured questions (for example Cursor **AskQuestion** with clear options) | Numbered A/B/C lists only, or burying choices in paragraphs |
| Compare alternatives, metrics, or trade-offs | Tables, diagrams, or charts via host visualization (for example **Canvas**, `/visualize`, or Mermaid for flows) | Large markdown tables duplicated in chat |
| Explore approval or Specify gates | Short decision summary plus one blocking question in structured form when multiple answers are valid | Presenting recommendations as already **Accepted** |
| Complex engineering or product planning | Architecture or timeline diagrams; charts when the answer is inherently quantitative | Long unstructured narrative without a scannable view |

**Proportionality:** A single obvious fix or yes/no does not need a questionnaire. A substantial Explore round with consequential forks should use structured input when the host supports it.

**Cowork and similar hosts:** When the environment offers form-like or panel UI for intake (analogous to questionnaire flows), use it for multi-field discovery instead of serial chat-only interrogation.

Coordinator responses still follow [flow.md](../flow.md) approval checkpoints; structured UI does not replace explicit **Explore → Specify** or **Build** authorization.

## Product app (GenUI)

During authorized **Build** for features that surface generative or data-driven UI in the product:

1. Implement through **`@repo/genui`**—compose pipeline, validated envelopes, host-owned actions ([genui.md](../specs/genui.md)).
2. Route recognized intents (metrics, charts, dashboards, forms, questionnaires) through **controlled or declarative** tiers before open-ended prose.
3. Extend the registry and orchestration in `packages/genui` when adding new component families; keep React views in sync with the contract library.
4. Do not emit unconstrained model HTML, scripts, or unknown components in the product shell.

Load **`ai-sdk`** (and related stack skills from [skills.md](skills.md)) when wiring compose APIs or agents; verify with GenUI unit tests and browser checks per [verification.md](verification.md).

## Charts and data

| Context | Guidance |
| --- | --- |
| **User asks for data, metrics, or “show me” analysis in chat** | Prefer a chart or visual summary when numbers drive the answer; cite sources in prose alongside the visual |
| **Product feature is analytics, status, or reporting** | GenUI chart/metric builders and fixtures pattern in `packages/genui` |
| **Complex task (planning, incident, architecture)** | One useful diagram or chart that clarifies dependencies, sequence, or comparative cost— not decoration |

If visualization tools are unavailable, fall back to concise markdown tables or Mermaid, and say that structured or canvas UI was not used.

## Related documents

- [genui.md](../specs/genui.md) — product GenUI pipeline and tests
- [verification.md](verification.md) — browser verification when product UI changes
- [skills.md](skills.md) — when to load GenUI / AI SDK skills during Build
