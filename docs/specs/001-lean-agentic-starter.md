# 001 — Lean Flow and Agentic Prototype Starter

Date: 2026-10-26  
**Status:** Current  
**Last reviewed:** 2026-10-26  
Owner: Gabo Esquivel  
**Delivery:** Implemented on branch **`simple`**.  
Source baseline: `meta-cto` @ `9afd416fa0093d49cdef114ea6837a50e8010b26`  
**Visual system:** default shadcn/ui (not Porcelain).

## Purpose

Experiment on the `simple` branch, created from `meta-cto` in the existing repository, with a much smaller development contract and a clean, reusable agentic web starter. Replace the custom Flow skill workflow with a lean **`FLOW.md`** at the repository root that supplies project overrides to Addy Osmani’s engineering skills. This is a branch experiment, not a fork.

The starter should let a developer begin an agentic prototype immediately: define API and MCP capabilities first, then expose them through a website, chat and an MCP App. Its reference experience accepts a UI request and generates a creative composition using only **`@repo/ui`** (`packages/ui`) components and realistic sample data.

## User, problem and smallest useful outcome

The primary user is Gabo, with solo developers and small teams as the broader audience. They need to turn an idea into a working agentic prototype without repeatedly rebuilding runtime integration, GenUI rendering, MCP interfaces or development process.

The present experiment addresses two sources of friction: too many workflow concepts and documents, and demo-specific code that must be removed before useful product work starts.

The smallest useful outcome is the `kiss` branch with:

- One understandable workflow: **Spec → Tasks → Build → Review → Ship**.
- A runnable web starter and MCP App demonstrating the same UI-generation capability.
- Eve runtime, Jev classification, OpenUI generation and the repository UI library connected end to end.
- No application authentication, authorization system or database requirement.
- Real delegated work and independent review, with concise evidence that survives session changes.

## Product experience

A user requests an interface, such as “Create a sales dashboard with a regional filter,” “Make a pricing comparison,” or “Create an onboarding form.”

The system interprets the request, generates a composition from registered `@repo/ui` components and layout primitives, supplies realistic synthetic data, and renders the result. Creative combinations and layouts are essential; the experience must not reduce every request to the same fixed template.

The web application and MCP App expose this same capability. A Hello World response may serve as a connection smoke test, but does not replace the GenUI demonstration.

“Any UI request” describes broad request coverage within the available component and interaction vocabulary. If a request requires an unavailable component or real integration, the system explains the limitation and offers a supported approximation. It must not claim to have performed an external action.

Follow-up refinement, local interaction details and the web chat/preview arrangement are proposed defaults below, not previously confirmed decisions.

## Requirements

| ID | Requirement | Observable acceptance |
| --- | --- | --- |
| P1 | Create `kiss` from `meta-cto`; remove the old Flow demo and assessment-specific product behavior from the delivered starter. | Record the source commit above; all implementation lands on `kiss`, leaving `meta-cto` unchanged. The starter has no portfolio, assessment or old Flow-demo dependency in its user flow. |
| P2 | Define capability contracts before interface implementation. | API and MCP adapters invoke shared capability logic with compatible inputs, outputs and errors; behavior is not implemented separately per surface. |
| P3 | Use the website’s GenUI technologies and relevant engineering standards. | Eve, Jev, AI SDK and OpenUI responsibilities are explicit and exercised. Exact dependency choices are verified against the reference during implementation. |
| P4 | Generate only with components exported by `@repo/ui`. | Registered components and layout primitives support varied compositions; unknown components and invalid props produce a usable error or recovery state. No arbitrary React code execution is required. |
| P5 | Support web, chat and an MCP App. | A UI request produces a rendered composition through the web experience and through an actual compatible MCP App host; shared capability results can be compared. |
| P6 | Use generated sample data with no database requirement. | The demonstration runs without a database service or migrations; displayed data is identifiable as synthetic. Faker is a preferred option, not a mandatory dependency. |
| P7 | Keep prototype setup lean and unauthenticated. | No sign-in, roles, permissions flow or application security-hardening workstream is introduced. Required model configuration and startup instructions are concise. |
| P8 | Report failure honestly. | Missing model configuration, classification failure, generation failure or invalid output does not appear as successful generation. Any fallback is identified. |
| P9 | Keep concise root product, architecture and design documents. | `PRODUCT.md`, `ARCHITECTURE.md` and `DESIGN.md` describe the current starter without placeholders or duplicated task plans, and link to numbered specs for rationale and history. |
| P10 | Replace the inherited/default styling with the minimal theme defined below. | `@repo/ui` implements the documented tokens and component treatments. Web, chat and MCP App use the same theme; generated compositions inherit it without per-output style invention. |

“No database” applies to the prototype’s application/data setup. Eve’s actual session/runtime infrastructure requirements must be checked rather than assuming that the runtime itself has no persistence.

### Factory baseline divergence (`kiss` only)

[Factory ADR 0001](../../.agents/flow/decisions/adr/0001-agentic-architecture.md) assumes Postgres/Drizzle as the reusable baseline. On **`kiss` only**, this spec and updated product `ARCHITECTURE.md` document removal of application database requirements for the prototype. Do not rewrite accepted Factory ADR status on `meta-cto` to claim the Factory baseline changed globally.

## Technical direction and reference

Use `gaboesquivel.com` as an architectural reference, not as a product-content template. The reviewed `develop` snapshot was `b1569c24a3cb680732035787be089a54ba05423a`.

- **Eve:** agent runtime and tool orchestration.
- **Jev:** classification and decision support through `@typesafe-ai/sdk`. The reference uses `systemOne`, typed choices and confidence-based routing. This is an internal capability, not a standalone classifier demo.
- **AI SDK and OpenUI Lang:** generation of declarative UI compositions, using the reference’s `@openuidev/react-lang` renderer and OpenUI compiler/schema integration. OpenUI Lang is the UI composition language; it is not the MCP transport protocol.
- **MCP Apps:** the standard app resource and host integration through `@modelcontextprotocol/ext-apps` and the appropriate MCP SDK. The app renders the shared OpenUI composition with `@repo/ui`. Do not introduce a separate MCP-UI library as an alternative framework.
- **Shared UI contract:** component registry, schemas, compiler/validation and React rendering, adapted to general-purpose `@repo/ui` components.
- **API and MCP:** thin adapters over shared capabilities; reusable result contract and rendering behavior across surfaces.
- **Web standards:** server-rendered initial shell, route-oriented colocation, reusable components, CSS-first motion, progressive enhancement and accessible interactions.

The website currently constrains generation to portfolio experiences and approved compositions. This experiment intentionally broadens the registered vocabulary to general UI and layout primitives. Use OpenUI Lang and MCP Apps exclusively for this generation/rendering path. Do not copy the website’s separate JSON-render booking implementation. Remove `@json-render/*` packages, catalogs, rendering adapters and demo-specific references from the starter; do not maintain a second UI-generation format. Ordinary JSON API payloads and JSON Schema remain valid infrastructure and are unrelated to JSON-render.

Preserve functional schema validation and server-side handling of provider credentials as basic implementation boundaries; do not turn them into an authentication or production-hardening project. Exact generation schema, classifier decisions, model selection and interaction bindings belong to implementation discovery within this spec’s scope.

## Lean Flow contract

**`FLOW.md`** at the repository root will mirror these overrides. Addy’s skills (installed per [`.agents/skills-lock.json`](../../.agents/skills-lock.json)) supply working methods; Flow should not reimplement their procedures.

1. **One unit of work:** everything is a task under **`docs/tasks/`**. No separate idea, initiative or epic lifecycle.
2. **Specs with concise current-state references:** change requirements, reasoning, design considerations, implementation outline and consequential decisions live together in the owning spec. Keep simple `PRODUCT.md`, `ARCHITECTURE.md` and `DESIGN.md` as current-state summaries, updating them when implemented behavior changes. No separate PRD, ADR or duplicated task plan is required. This document is the initial spec.
3. **Proportional specification:** a small task can contain its own short spec; related tasks reference a shared numbered spec.
4. **Product thinking:** before substantial work, establish the user, problem, smallest useful outcome, scope and observable acceptance criteria. Reuse known answers; ask only consequential questions.
5. **Delegation on every task:** the coordinator owns scope, assignment, canonical spec updates, integration and final synthesis. Delegate discovery, research, critique, design, implementation and verification wherever useful.
6. **Useful concurrency:** parallelize independent assignments up to available capacity; sequence dependencies and avoid overlapping writes. Require concrete findings or artifacts from subagents.
7. **Independent review:** a reviewer distinct from the implementer checks the work. The coordinator reconciles findings and verifies acceptance before closure.
8. **Honest execution:** if subagents are unavailable, explicitly report the constraint and do not describe solo work as compliant.
9. **Continuity:** preserve links among tasks, specs, decision rationale, evidence, reviews and delivered results. A new session must be able to resume unfinished work.
10. **Proportional delivery:** tests are part of Build and Review. Ship means delivering the agreed result, not necessarily deploying. No repeated approval gates or extra documents by default.
11. **Agent and MCP TDD:** before implementing or changing agent behavior or MCP contracts, write a focused failing test, implement the smallest passing change, then refactor and rerun relevant checks. Agent tests must verify observable decisions, tool use, outputs and failure handling; MCP tests must exercise actual handlers and protocol contracts. Do not substitute prompt snapshots or mocked success assertions for behavior verification.

On `kiss`, [AGENTS.md](../../AGENTS.md) must resolve agent entrypoints to **FLOW.md** first. [.agents/flow/flow.md](../../.agents/flow/flow.md) may stub-point to **FLOW.md** so Factory lifecycle docs do not compete.

## Documentation and retention

### Confirmed direction

Use sequentially numbered specs in `docs/specs/`, for example this file. Implemented specs must not be rewritten to describe later behavior. A subsequent change gets a new spec that identifies what it builds on or supersedes and preserves the reason for the change.

Keep the root documents short and useful:

- `PRODUCT.md`: intended user, problem, core experience, scope and current capabilities.
- `ARCHITECTURE.md`: stack, package boundaries, API/MCP contracts, Eve/Jev/GenUI data flow and test commands or links to their canonical definitions.
- `DESIGN.md`: theme tokens, typography, spacing, component treatment, responsive layout, interaction and accessibility rules.

These are living references, not immutable specs. Update them with the corresponding code changes and link to the owning numbered spec. Keep setup in README and process overrides in **FLOW.md**. Do not copy full specs or task histories into root documents.

## Default visual direction: Porcelain

Choose a light-first, restrained theme with warm off-white surfaces, ink typography and a muted indigo accent. It should feel modern and elegant across dashboards, forms, tables and chat, with no portfolio branding and no stock shadcn black-button/neutral-card appearance. Keep shadcn component behavior while changing the shared visual system.

| Token or treatment | Default |
| --- | --- |
| Canvas | Warm porcelain `#F7F7F2` |
| Surface / elevated surface | White `#FFFFFF`; subtle shadow only for overlays |
| Primary text | Ink `#202522` |
| Secondary text | Slate `#626A65` |
| Dividers / disabled borders | Soft gray-green `#E1E5DE`; not the sole boundary for interactive inputs |
| Interactive borders | `#7D867F`, verified against adjacent surfaces |
| Primary action / focus | Muted indigo `#4F46A5`; white action text |
| Selected surface | Pale lavender `#EFEDF8` with ink/indigo text |
| Typography | System sans-serif, comfortable body leading, medium-weight headings, tabular numerals for data |
| Spacing | 4px base scale; 16–24px section gaps and generous page margins |
| Shape | 8px controls, 12px panels; pills only for compact tags/status |
| Motion | Short CSS opacity/color transitions; respect reduced motion |

Favor open whitespace, clear type hierarchy, subtle separators and varied grids over nested cards. Use explicit semantic colors for status and distinct chart series; the accent is not a universal status color. Dense layouts must retain readable labels and visible focus. Mobile layouts stack cleanly. Light mode is the initial default; adding a theme switcher or a second theme is not required.

Implement the theme centrally in `@repo/ui`: semantic CSS variables, shared typography and spacing conventions, component variants and layout primitives. Match `DESIGN.md` to the implemented values in the same change. The generator may compose those primitives creatively but must use the shared theme vocabulary. The MCP App must receive the same styles within its rendering boundary; do not assume it inherits the web page’s CSS.

Verify text, focus and control contrast against the actual colors and inspect representative forms, tables, chat and generated layouts manually. Use existing non-browser tooling where helpful; this does not add a Playwright or E2E requirement.

## Implementation outline

1. Inspect `meta-cto`, record its source commit and create `kiss` without disturbing unrelated changes. If `kiss` already exists, inspect and preserve its work rather than resetting it.
2. Establish lean **FLOW.md**, this numbered spec and concise root reference documents; resolve conflicting agent instructions.
3. Remove assessment/Flow-demo content and unnecessary auth, database and browser/E2E scaffolding while preserving reusable agentic capabilities.
4. Define the shared generation capability and API/MCP contracts. Write failing agent and MCP tests before implementing the affected behavior.
5. Implement the Porcelain theme in `@repo/ui` and synchronize `DESIGN.md`; connect the registered components and layout primitives to the OpenUI contract.
6. Connect Eve, Jev, generation and synthetic data to the web/chat and MCP App surfaces. Independent UI and runtime work may proceed in parallel after contracts are stable.
7. Complete focused automated checks and manual demonstrations, independent review, and the small-task/shared-spec workflow trials. Update current-state docs and completion evidence before freezing the spec.

### Proposed lean default

Use one working **`docs/tasks/todo.md`**, with task IDs scoped to their spec. Entries hold scope, acceptance, dependencies, implementer/reviewer assignments, status and evidence. Keep the implementation outline in the spec rather than introducing `docs/tasks/plan.md`.

Specs remain editable while being specified and implemented. Before marking a spec completed, add a compact completion record linking task IDs to outcomes, subagent contributions, review, checks and delivered commits or artifacts. Then freeze it.

Completed checklist entries may be cleared only after durable evidence has been consolidated. Never overwrite unresolved or blocked work. For small tasks whose spec exists only in the checklist, preserve the concise task/spec record in a durable commit or completion record before removing it.

This retention policy is a recommendation awaiting confirmation. Addy’s planning skill defaults to `tasks/plan.md` plus `tasks/todo.md`, protects unfinished work, and permits a designated external tracker. It does not mandate a permanent file for every completed task. Combining planning into the spec is a Flow override.

## Validation of the experiment

Validate both the workflow and the starter. Do not confuse proposed tests with executed evidence.

**Small-task trial:** complete one bounded task using a short inline spec, real delegated implementation and a distinct reviewing subagent. Show proportional documentation and an evidence-backed outcome.

**Shared-spec trial:** complete multiple dependent and independent tasks under one numbered spec. Demonstrate actual parallel work where appropriate, coordinated writes, an interruption/handoff followed by successful resumption, independent review and integrated acceptance verification.

**Test tooling:** retain the Node.js built-in test runner (`node --test`) and dependencies needed for focused unit, agent and MCP tests, with runnable examples and commands aligned with the monorepo today. General application tests are optional and proportional. Agent and MCP TDD is mandatory. Exclude Playwright, browser-test harnesses and automated E2E suites from the starter; remove inherited scripts and dependencies used solely for those suites. No UI automation or browser-test gate is required.

**Product checks:** use focused automated tests for agent decisions, tool calls, generation results, failure behavior and MCP request/response contracts. Cover supported requests such as a dashboard, comparison view and form, including component-contract compliance and generated data. Show the shared capability in the web and an MCP App host through a lightweight manual demonstration, without a Playwright or E2E suite. Report host rendering as unverified if it was not observed; protocol tests alone do not prove host rendering.

**Completion bar:** every accepted requirement must have passing evidence before the experiment is marked complete. Unmet requirements remain explicit blockers. Record actual commands/results, runtime/host used, subagent contributions, review findings and final artifact/commit links. No numeric latency, cost or quality threshold has been agreed; collect those measurements before setting targets.

## Out of scope

Production authentication and authorization; security-hardening scope; real customer data; database-backed persistence; external business integrations; arbitrary generated JavaScript execution; portfolio features; the discarded feeling/intent classifier demo; a separate Hello World product; new factory infrastructure or a GitHub Kanban integration; Playwright, automated browser testing and E2E suites; JSON-render or a competing UI-generation/rendering stack.

## Open choices and recommended defaults

| Choice | Recommendation / status |
| --- | --- |
| Completed-task retention | One working checklist; consolidate durable evidence before clearing completed entries. Awaiting confirmation. |
| Web layout | Chat beside a live preview, with follow-ups updating the current composition. Suggested, not confirmed. |
| Interaction scope | Local filtering, sorting, forms, tabs and dialogs where the registered components support them. Suggested initial boundary. |
| Data/session continuity | Seeded Faker data stable across refinements; no application database. Refresh behavior and Eve session storage remain to be settled. |
| Source commit | Pinned at top of this spec when `kiss` was cut. |
| Performance and cost | Measure first; agree budgets before making them release criteria. |

## Evidence and status

### Completion record — specification delivery (2026-10-26)

| Item | Evidence |
| --- | --- |
| Spec landed on `meta-cto` | `9e2f85dd4` — `docs/specs/001-lean-agentic-starter.md` only |
| Assessment product unchanged | FI routes, `@repo/fi`, and assessment docs remain on `meta-cto` |
| `kiss` implementation | **Not started** — deferred; cut `kiss` from baseline above when Build is authorized |
| Workflow trials (small-task / shared-spec) | **Not run** — applies when implementation begins |
| Product checks P1–P10 | **Not applicable** on `meta-cto` until `kiss` Build |

Repository verification before push (2026-10-26): `pnpm check-types` exit 0, `pnpm test` exit 0, `pnpm --filter @repo/db db:check` exit 0 (`pnpm qa` knip reports pre-existing unused-export noise unrelated to this spec).

References:

- [Reference website at reviewed commit](https://github.com/gaboesquivel/gaboesquivel.com/tree/b1569c24a3cb680732035787be089a54ba05423a)
- [Jev decisions](https://github.com/gaboesquivel/gaboesquivel.com/blob/b1569c24a3cb680732035787be089a54ba05423a/lib/genui/decisions.ts)
- [OpenUI composition](https://github.com/gaboesquivel/gaboesquivel.com/blob/b1569c24a3cb680732035787be089a54ba05423a/lib/genui/semantic.ts)
- [Agent standards](https://github.com/gaboesquivel/gaboesquivel.com/blob/b1569c24a3cb680732035787be089a54ba05423a/AGENTS.md)
- [Addy: planning and task breakdown](https://github.com/addyosmani/agent-skills/blob/main/skills/planning-and-task-breakdown/SKILL.md)
- [Addy: incremental implementation](https://github.com/addyosmani/agent-skills/blob/main/skills/incremental-implementation/SKILL.md)
