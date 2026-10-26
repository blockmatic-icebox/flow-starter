# 001 — Lean Flow and Agentic Prototype Starter

Date: 2026-10-26  
**Status:** Current  
**Last reviewed:** 2026-10-26  
Owner: Gabo Esquivel  
**Delivery:** Implemented on branch **`simple`**.  
Source baseline: `meta-cto` @ `9afd416fa0093d49cdef114ea6837a50e8010b26`  
**Visual system:** Porcelain ([DESIGN.md](../../DESIGN.md)).

## Purpose

Experiment on the `simple` branch, created from `meta-cto` in the existing repository, with a much smaller development contract and a clean, reusable agentic web starter. Replace the custom Flow skill router with **Matt Pocock’s published engineering skills** (installed per [`.agents/skills-lock.json`](../../.agents/skills-lock.json); human guide in [README.md](../../README.md) and [docs/simplified-flow-prd.md](../simplified-flow-prd.md)). This is a branch experiment, not a fork.

The starter should let a developer begin an agentic prototype immediately: define API and MCP capabilities first, then expose them through a website, chat and an MCP App. Its reference experience accepts a UI request and generates a creative composition using only **`@repo/ui`** (`packages/ui`) components and realistic sample data.

## User, problem and smallest useful outcome

The primary user is Gabo, with solo developers and small teams as the broader audience. They need to turn an idea into a working agentic prototype without repeatedly rebuilding runtime integration, GenUI rendering, MCP interfaces or development process.

The present experiment addresses two sources of friction: too many workflow concepts and documents, and demo-specific code that must be removed before useful product work starts.

The smallest useful outcome is the `simple` branch with:

- One understandable workflow: **discovery → spec (GitHub) → tickets → implement → review → ship**, using Matt skills proportionally (see README).
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
| P1 | Create `simple` from `meta-cto`; remove the old Flow demo and assessment-specific product behavior from the delivered starter. | Record the source commit above; all implementation lands on `simple`, leaving `meta-cto` unchanged. The starter has no portfolio, assessment or old Flow-demo dependency in its user flow. |
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

### Factory baseline divergence (`simple` only)

[Factory ADR 0001](../../.agents/flow/decisions/adr/0001-agentic-architecture.md) assumes Postgres/Drizzle as the reusable baseline. On **`simple` only**, this spec and updated product `ARCHITECTURE.md` document removal of application database requirements for the prototype. Do not rewrite accepted Factory ADR status on `meta-cto` to claim the Factory baseline changed globally.

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

## Development workflow (Matt Pocock skills)

Matt’s installed skills supply working methods; do not add a custom Flow phase router or duplicate their procedures. Human operating guide: [README.md](../../README.md#matt-pocock-workflow); experiment PRD: [docs/simplified-flow-prd.md](../simplified-flow-prd.md).

1. **Tracker:** **GitHub Issues** for multi-session specs and child tasks; numbered specs in `docs/specs/` for durable rationale (this file is the initial spec).
2. **Current-state docs:** keep `PRODUCT.md`, `ARCHITECTURE.md` and `DESIGN.md` as short summaries; update when verified behavior changes; link issues and `docs/adr/` for consequential decisions.
3. **Proportional ceremony:** small clear work uses `/implement`; large or foggy work uses `grill-with-docs`, `wayfinder`, `to-spec`, and `to-tickets` only when warranted.
4. **Product thinking:** before substantial work, establish user, problem, smallest useful outcome, scope and observable acceptance. Reuse known answers; ask only consequential questions.
5. **Delegation:** delegate research, implementation, and review when useful; the integrator owns scope, conflicts, and evidence.
6. **Honest verification:** distinguish implemented, verified, and unverified outcomes; agent and MCP TDD for behavior and protocol changes (Matt `tdd` skill where appropriate).

On `simple`, [AGENTS.md](../../AGENTS.md) points to root contracts and the README workflow section—not a root **`FLOW.md`** or mandatory Addy skill chain.

## Documentation and retention

### Confirmed direction

Use sequentially numbered specs in `docs/specs/`, for example this file. Implemented specs must not be rewritten to describe later behavior. A subsequent change gets a new spec that identifies what it builds on or supersedes and preserves the reason for the change.

Keep the root documents short and useful:

- `PRODUCT.md`: intended user, problem, core experience, scope and current capabilities.
- `ARCHITECTURE.md`: stack, package boundaries, API/MCP contracts, Eve/Jev/GenUI data flow and test commands or links to their canonical definitions.
- `DESIGN.md`: theme tokens, typography, spacing, component treatment, responsive layout, interaction and accessibility rules.

These are living references, not immutable specs. Update them with the corresponding code changes and link to the owning numbered spec. Keep setup and the Matt workflow guide in **README.md**. Do not copy full specs or task histories into root documents.

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

1. Inspect `meta-cto`, record its source commit and create `simple` without disturbing unrelated changes. If `simple` already exists, inspect and preserve its work rather than resetting it.
2. Install Matt workflow skills, document the human guide in README, keep this numbered spec and concise root reference documents; resolve conflicting agent instructions.
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
| Source commit | Pinned at top of this spec when `simple` was cut. |
| Performance and cost | Measure first; agree budgets before making them release criteria. |

## Evidence and status

### Completion record — specification delivery (2026-10-26)

| Item | Evidence |
| --- | --- |
| Spec landed on `meta-cto` | `9e2f85dd4` — `docs/specs/001-lean-agentic-starter.md` only |
| Assessment product unchanged | FI routes, `@repo/fi`, and assessment docs remain on `meta-cto` |
| `simple` implementation | **Delivered** — GenUI studio, shared compose across web/MCP/Eve, Porcelain theme, assessment copy removed |
| Workflow trials (small-task / shared-spec) | **Partial** — Matt skills in lockfile; ADR 0002 documents Matt workflow; GitHub tracker setup via `setup-matt-pocock-skills` not automated in CI |
| Product checks P1–P10 | **Mostly verified** on `simple` — P3 Jev wired for ambiguous routes with regex fallback; P5 MCP App host rendering unverified without live host; P8 unsupported requests fail honestly |
| Closeout evidence (2026-10-26) | `pnpm --filter @repo/genui test` and `pnpm eval:genui:offline` 102/102 pass; studio create vs refine; Eve `compose-ui` execute test in `apps/web/tests/agent/`; Vercel `flow-starter` → `apps/web`; Neon project `flow-starter` for optional `DATABASE_URL` |
| Deploy (2026-10-26) | PR [#8](https://github.com/gaboesquivel/flow-factory/pull/8) **merged** to `main` (`edfdefe42`); production https://flow-starter-gaboesquivel.vercel.app/ |
| Audit (2026-10-26) | External review at `447de36c` — [reconciliation](001-audit-reconciliation-2026-10-26.md) maps findings to post-closeout `main` |
| CI fixes (2026-10-26) | PR commit check uses `pull_request.head.sha`; knip ignores Eve/Jev deps; `undici>=8.12.2` override in `pnpm-workspace.yaml` |

Repository verification (2026-10-26): `pnpm check-types`, `pnpm test`, `pnpm knip`, `pnpm security:osv` (main lockfile) exit 0. P5 MCP App **host** rendering remains manual; protocol tests + `build:mcp-app` cover bundle and routes.

References:

- [Reference website at reviewed commit](https://github.com/gaboesquivel/gaboesquivel.com/tree/b1569c24a3cb680732035787be089a54ba05423a)
- [Jev decisions](https://github.com/gaboesquivel/gaboesquivel.com/blob/b1569c24a3cb680732035787be089a54ba05423a/lib/genui/decisions.ts)
- [OpenUI composition](https://github.com/gaboesquivel/gaboesquivel.com/blob/b1569c24a3cb680732035787be089a54ba05423a/lib/genui/semantic.ts)
- [Agent standards](https://github.com/gaboesquivel/gaboesquivel.com/blob/b1569c24a3cb680732035787be089a54ba05423a/AGENTS.md)
- [Matt Pocock skills](https://github.com/mattpocock/skills)
- [Simplified Flow experiment PRD](../simplified-flow-prd.md)
