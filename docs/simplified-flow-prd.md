# Simplified Flow — Product-First Experiment PRD

**Date:** 2026-10-26  
**Status:** Draft v7 — proposed experiment; not implemented or independently verified  
**Repository:** `gaboesquivel/flow-factory`  
**Working branch:** Fresh `kiss` based on an inspected `meta-cto` commit; do not delete/reset an existing branch without explicit owner action  
**Companion:** [Flow Factory postmortem](flow-postmortem.md)  
**Replaces:** Earlier Addy-led Flow Reset / lean agentic starter workflow drafts as the _active experiment proposal_. Their product/technical insights remain historical context.

## 1. Decision and experiment goal

**Adopt Matt Pocock's published engineering skills and workflow as the primary development method. Do not create another Flow methodology, custom skill router, orchestration harness, evaluation factory, or skill adaptation layer until a specific real failure justifies it.** Flow Factory remains the starter/project name; it does not need to supply an additional procedural framework.

The experiment tests a concrete, product-centered hypothesis:

> Can the existing Matt workflow help one developer deliver a **complete, believable, useful agent/API/MCP-first product slice**—with better product discovery, realistic data, clear decisions, focused tests and verified client behavior—within a constrained scope, without new workflow ceremony?

This is not a benchmark of agents, an Addy-vs-Matt comparison, or an autonomous self-improvement run. Measure useful outcomes and actual overhead manually. A valuable result is discovering where Matt's existing tools need clearer **product input**, not writing more skills.

### Why this change

The postmortem found a reusable starter, agent-first thinking, agent/MCP TDD and conversational access promising. The largest gaps were oversized scope, process/eval experimentation during delivery, unexamined assumptions, missing comparison with existing products, ambiguous taxonomy, incomplete journeys, weak UX validation, and unrealistic sample requests. The next experiment must protect time for **human product judgment** instead of optimizing the workflow itself.

## 2. Scope and guardrails

### In scope

- Inspect current code, runtime, branch, skills and prior decisions before modifying them. Preserve viable starter code and security/stack constraints.
- Install/configure only the **relevant Matt skills and their stated dependencies**, with GitHub Issues as the tracker. Verify actual client support rather than inferring installation from a lockfile.
- Document the human operating experience in the root `README.md` and keep `AGENTS.md` small (navigation and a few cross-cutting product principles). No custom Flow skill or phase router.
- Use Matt's discovery, domain modeling, optional sourced research, prototyping, specs, tickets, implementation/TDD, code review and retrospective methods **when the task warrants them**.
- Maintain short, accurate `PRODUCT.md`, `DESIGN.md`, and `ARCHITECTURE.md` as the agent's current-state entry points; link them to GitHub issues, PRs and applicable decision records.
- Build one **end-to-end, agent/MCP-first vertical slice** in a single coherent example product, with realistic personas and seed data; test through an actual supported client.
- Proactively delegate bounded research, implementation and review where useful; run parallel implementation only when dependencies and client isolation make it safe.
- Record consequential decisions and product evidence in the existing skill conventions, with a **single decision sequence across product/design/architecture** (no PDR/ADR taxonomy split).

### Out of scope

A new Flow workflow engine; mandatory project-init command; automatic skill routing; custom subagent roles; new eval/self-improvement infrastructure; automatic documentation rewriting; a second task system; mandatory metrics/business case or visual prototype for every headless feature; all assessment features implemented simultaneously; broad UI/browser automation suites merely to grade the process.

**Preserve useful parts of the original agentic-starter technical vision** (Eve, Jev, AI SDK, OpenUI Lang, MCP Apps, shared contracts, `repo/ui`, focused agent/MCP tests) when verified and relevant. This workflow experiment is not authorization to rebuild every technical capability or to remove baseline protections.

## 3. One source of truth per kind of information

```text
README.md           # Human setup, Matt workflow guide, real skills and concrete examples
AGENTS.md           # Short pointers to current docs, tracker and relevant conventions
PRODUCT.md          # Current intended users, core jobs/capabilities, priority, success signals
DESIGN.md           # Current user journeys and interaction principles; visual system if relevant
ARCHITECTURE.md     # Verified modules, API/MCP/agent/data flow, boundaries, run/test commands
GLOSSARY.md         # Created lazily if resolved shared domain terms justify it (Matt convention)
docs/adr/           # Numbered durable decisions, product + design + technical in one sequence
.github/            # GitHub tracker configuration only if needed by the chosen skills
```

**GitHub Issues is the canonical tracked work system:**

- **Spec issue:** Snapshot of agreed user outcomes, constraints, implementation and testing decisions. Not a constantly synchronized product reference.
- **Child task issues:** Bounded, independently verifiable delivery tickets; native sub-issues express hierarchy and blockers express dependencies.
- **PR:** Integrates verified behavior and links to spec/tasks and any relevant decision. It is also the normal place to update affected root summaries.
- **Research notes:** Matt's `research` skill may create one dated, sourced Markdown file when outside facts matter; don't require research output for routine tasks.

**Don't duplicate:** `docs/specs/`, `tasks/todo.md`, `docs/ideas/`, `docs/initiatives/`, a separate `flow.md`, or both `docs/decisions/` and `docs/adr/`. Local scratch/tickets may be used temporarily if the actual tracker is unavailable, but not as a competing durable backlog. An obvious single-session fix can proceed without a GitHub issue.

### Trade-off: decision location

Our earlier draft preferred `docs/decisions/` for one numbered sequence across product and engineering. **For this Matt-first trial, use the default `docs/adr/` location** to avoid fighting `grill-with-docs`/`domain-modeling`. ADR is a filename convention, not a restriction to architecture: a consequential **product** or **experience** trade-off may be recorded there as well. Keep one sequence, create ADRs sparingly, and do not create separate PDRs. If this convention proves confusing in actual use, assess a small path change later instead of building a routing layer now.

### Current-state contracts and drift

The three root files are **navigation and current truth**, not required fill-in-the-blank deliverables. The starter may initially describe only verified starter capabilities, not an imaginary finished product. Product and Design summaries should evolve when a product and its journeys are accepted; headless interactions belong in DESIGN.md even when branding is irrelevant.

Before a meaningful change, the main agent reads relevant current-state summaries, links to the active GitHub issue, related ADRs and actual code. During implementation/review:

| What changed | Correct response |
| --- | --- |
| Code diverges from an accepted user/product/technical decision | Flag it, verify the original intent, and resolve with the human before treating the divergence as approved |
| Requirements intentionally change | Record the change in the issue discussion or successor issue; create an ADR only if lasting and consequential |
| Accepted behavior is implemented but current-state docs are stale | Update **only the affected** `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md` in the same PR, citing the issue/ADR and observed reality |
| No meaningful contract change | No ceremonial docs edit |

**Do not rewrite specs, ADRs or root summaries automatically on push to rationalize unexpected code.** An optional advisory PR-diff audit can be considered only after manual work exposes actual repeated drift. No hook/agent job is required in the first trial. Report concise contract impact in the PR/task summary.

## 4. How a human uses the selected Matt workflow

The root README should explain what is installed, what is **declared but not installed**, which commands are manually invoked, and what happens automatically _inside a loaded skill_. Skills are not globally loaded just because they appear in a manifest. Use only verified names supported in the chosen client.

| Situation | Matt skill | Result and proportional rule |
| --- | --- | --- |
| Understand a vague product/change in a repo | `/grill-with-docs` (depends on `grilling`, `domain-modeling`) | Interactive questions; resolved vocabulary and rare ADRs. Human reviews consequential terms. No new spec by default |
| Large unclear effort spanning sessions | `/wayfinder` | Decision map on tracker; **only when genuinely too foggy/large for one session**, not a standard kickoff |
| Outside evidence could change a decision | `research` | Background subagent with sourced findings; choose relevant existing **products**, not only APIs |
| Interaction/state/design uncertainty needs firsthand evidence | `/prototype` | Throwaway logic or UI experiment, reviewed by the human; link validated learning |
| Decided work will span sessions | `/to-spec` | One GitHub spec issue synthesizing _decisions already made_, not a substitute for discovery |
| Multi-session spec needs implementable slices | `/to-tickets` | Native child tickets and blocking graph; question every proposed ticket's demonstrable outcome |
| One small, clear change | `/implement` | Skip spec/ticket ceremony; test and review proportionally |
| Independent tickets and safe worktree support | `/implement-spec` | Parallel implementers across ready blockers; integrates in one branch, with review; not useful without true concurrent isolated workers |
| Analyze a hard bug | `/diagnosing-bugs` | Tight reproducer and regression evidence before changing behavior |
| Examine results and improve the agent environment | `/retro` | Review _actual_ failures and propose targeted navigation/checks; no autonomous self-improvement loop |

Matt's main chain is generally **`grill-with-docs → to-spec → to-tickets → implement / implement-spec → review → retro`**, but only for work needing that much coordination. Keep discovery → spec → ticket decomposition in one context where practical; don't use a new session simply to satisfy a stage. TDD/review are driven by implementation skills; verify they actually ran. The skill docs, not this table, are authoritative for command and dependency details.

**Important operational safeguards:** `ready-for-agent` on a _parent spec_ must not cause an AFK worker to implement the entire spec. Dispatch only actual implementation tickets. Native dependency relationships may not reflect tickets whose code has landed on an integration branch but whose issues remain open; the coordinator needs to track successfully merged work. Isolated worktrees don't prevent shared-file semantic conflicts or guarantee untracked database fixtures exist. Test `implement-spec` on a small graph before relying on it under a deadline.

### README example prompts

- “Use `grill-with-docs` to clarify this product's main user jobs, vocabulary and priorities. Challenge assumptions, show me any consequential decisions, and recommend research or a prototype where useful.”
- “Research how three relevant products support task intake and triage, focusing on actual interaction patterns and failure/correction flows. Cite primary sources and present a short recommendation.”
- “Our scope is settled. Use `to-spec` to publish the agreed task-creation/triage journey to GitHub, then `to-tickets` if the work needs multiple independent sessions. Keep the first demonstrable MCP path small.”
- “Implement the first unblocked issue, verify it through an actual MCP client, and report technical checks separately from user-journey verification.”

## 5. Product-first habits that should steer the skills

**This is the only intentional value-added guidance**, not an additional skill or mandatory questionnaire. Before a substantial product choice or initial spec, consider these questions proportionately:

1. **User and job:** Who is the actor and what concrete job/benefit should they achieve? Which 1–3 journeys matter first, across agent chat, MCP, API or web?
2. **Existing solutions:** What real products already solve something similar? Which workflows, patterns, shortcomings, and architectural constraints are relevant? Ask a research agent to investigate when the answer could change the solution; do not perform routine competitive theatre.
3. **Language and model:** What do _task_, _request_, _triage_, _severity_, _status_, _confirmation_ and _publication_ mean here? Are relationships and state changes agreed? Challenge inconsistent terms and capture **only confirmed vocabulary**.
4. **Experience:** For the first user journey, what does the person say/do, what does the system return, how can they inspect/correct it, and what happens on failure? A headless client counts. When visual UI is part of the outcome, ask for references and prototype genuinely different directions before significant implementation.
5. **Evidence and success:** What is a falsifiable success condition now? A prototype may target successful completion and reliable behavior; do not invent revenue metrics. If business or product metrics are material, research and record why those ones matter.
6. **Realistic scenarios and seed data:** Choose **one coherent example product**, distinct personas with actual goals and language, and believable requests covering normal, ambiguous and failure cases. Inspect suggestions and fixtures for robotic numbering, internal demo phrasing and accidental JPEG/PNG/file references. Generated Faker records are not automatically realistic.
7. **Scope:** What is the smallest real user job we can prove? Which insights, dashboard features, integrations or polish can be explicitly deferred without breaking the agreed core requirements?

Challenge consequential assumptions and present a brief recommendation with evidence, alternatives, risks, and the smallest useful next step. **Do not manufacture disagreement, user research, metrics, or decisions.** Escalate only consequential choices to the human. Save external research when it will be useful later, not automatically for every feature.

### A spec is downstream of product decisions

`/to-spec` documents a settled direction; it does **not** discover the right product by itself. If the result is an excellent specification of an artificial user journey, technical implementation can still succeed while the product fails. The human should review **core journey, agreed vocabulary, realistic scenario examples, test seams and out-of-scope choices** before the issue is decomposed.

## 6. What to build first: breadth of understanding, depth of delivery

Use one initial coherent product definition to establish the essential domain, task/triage capabilities, minimal schema/API/MCP boundaries, and intended success. This need not be a giant spec or a commitment to implementing all features. Break work into small **tracer-bullet** tickets (or implement directly when small enough): each must have an observable result and acceptance check.

**Illustrative agent-first sequence, subject to actual product scope:**

- **First slice — create task:** real supported chat/MCP client → agent/tool → persist → retrieve/confirm a created task, including an important failure case.
- **Next slice — triage:** request triage of a task → explanation/classification → intended state update → retrieved result, covering ambiguity and errors.
- **Then — human review/correction/confirmation:** only when included in the accepted scope and ready to implement; don't claim complete triage if required steps remain untested.
- **Later — insights and richer web UX:** only once essential user value is proven or the actual assessment scope requires them sooner.

A database migration or isolated MCP handler can be a valid **technical spike**, but not a complete user journey. An MCP-client-to-database flow can be a valid **headless vertical slice**, with no custom UI. Product visual design is independently validated when web UI is part of the agreed outcome.

**Evidence must be labeled:** (A) automated agent/MCP behavioral and protocol tests, including red/green and failure paths; (B) observed complete journey in a real compatible client; (C) visual/interaction usability of an intended web app. Don't infer B or C from A.

## 7. The manual experiment

1. **Inspect** current `meta-cto`, repository contracts, available Matt skills, and real client/`gh`/worktree capabilities. Record the branch source commit and leave old branches untouched unless separately authorized.
2. **Configure the tracker** using Matt's `setup-matt-pocock-skills` and its GitHub issue/label conventions. Scope GitHub access correctly; do not publish confidential assessment content to a public issue. Verify native sub-issue/blocking support in the actual environment.
3. **Simplify human/agent guidance**: root README explains the real workflow; AGENTS.md is a short navigation map; maintain current-state PRODUCT/DESIGN/ARCHITECTURE based on verified facts. Remove legacy Flow routing, duplicate tasks/spec directories and obsolete eval infra **only after assessing dependencies**, not via blind deletion.
4. **Select one believable product scenario** for a realistic task-creation and triage demo. Have a product conversation via `grill-with-docs`; resolve terminology with the human. Do focused product-solution research and a logic/UI prototype only where genuine uncertainty warrants it. Review example prompts and persona/seed-data realism before implementation.
5. **Settle the scope** and define the essential jobs and observable acceptance. If multi-session, publish a GitHub spec issue with `/to-spec`, then generate **only useful tracer-bullet** sub-issues with `/to-tickets`; review dependencies and avoid layer-only or over-fragmented tickets. For single-session work, use `/implement` directly.
6. **Implement a real headless vertical slice**, using TDD and real MCP client verification. Proactively delegate bounded independent work and test `implement-spec` on a small independent ticket graph only if the client can provide safe parallel worktrees. Stop rather than launching unbounded review/fix loops.
7. **Review product quality and documentation** in the implementation PR: accurate seed/persona examples, complete user journey, errors/recovery, issue and decision links, and affected current-state root documents. Verify separately what was tested, what was observed, and what remains incomplete.
8. **Run `retro` once** on the concrete experience, capturing failures and low-cost improvements to navigation, checks, skills usage or review practices. Do not automatically implement a new methodology or self-healing harness.

### Acceptance criteria

| ID | Observable outcome |
| --- | --- |
| A1 | Repo shows actual installed/available Matt skills, dependencies, GitHub tracker setup and manual invocations; no legacy Flow router required. |
| A2 | README teaches the workflow with realistic examples; AGENTS.md is concise and points to repo truth and tracker; skills are not claimed loaded merely because installed. |
| A3 | GitHub Issue is the canonical multi-session spec; native sub-issues/dependencies manage tasks. There is no duplicate durable `tasks/todo.md` or Markdown spec inventory. |
| A4 | One believable single-product scenario, reviewed personas and user-language requests are used; no artificial numbering, recursive demo requests or accidental media file references in suggestions. |
| A5 | Human reviews core user job, success state, domain terminology and consequential choices before multi-session spec publication; missing evidence is identified rather than invented. |
| A6 | Targeted product comparisons and/or prototype are performed when they resolve a specific uncertainty; findings cite inspected evidence, or reasons for deferral are explicit. |
| A7 | One complete chat/MCP → agent/tool → database → observable result/failure pathway is exercised through an actual compatible client, with relevant TDD/protocol evidence. |
| A8 | Product/Design/Architecture summaries distinguish proposed from implemented behavior and are corrected in the same PR as verified material changes; no drift is auto-legitimized by code changes. |
| A9 | One main agent integrates subagent outputs, actual verification and conflicts; parallelism uses real independent work when useful, not obligatory worker counts. |
| A10 | A non-impact fix incurs no ceremonial docs/issue creation; a multi-session feature demonstrates the GitHub spec/tickets flow without over-decomposition. |
| A11 | The owner conducts a firsthand product-journey review and records UX/data-quality issues separately from code/test pass results. |
| A12 | One concise retrospective explains what improved or failed without launching another agent-evaluation/self-improvement system. |

## 8. Risks and decisions we are deliberately not automating

- **GitHub issue drift:** spec issues are editable snapshots. Preserve consequential revisions in issue discussion/new spec or ADR; root summaries reflect accepted _current_ behavior, not whatever code last changed.
- **Matt skill prerequisites and portability:** `grill-with-docs` needs `grilling` + `domain-modeling`; `implement-spec` needs actual isolated concurrent workers; not every tool/client can honor every slash command. Verify setup rather than assuming it.
- **Parent spec dispatch:** Matt's `to-spec` may label the parent spec `ready-for-agent`; ensure AFK workers target actual implementation tickets only.
- **Over-decomposition and shared files:** never create sub-issues merely to parallelize code layers. Review ticket demo paths, blockers, shared contracts, naming and database fixtures before dispatch.
- **Product validation versus execution evidence:** impressive test counts or a passing evaluation harness do not prove usefulness, realistic seeded data, working triage or good UX. Human observes the outcome.
- **Sensitive assessment materials:** a public GitHub repository may expose issues and attached specs. Use private issues/repos or redact/seek permission for confidential contents.
- **Limited time:** protect discovery and real-client validation; drop secondary features before compromising the main journey. An incomplete milestone is reported as incomplete.

## 9. References

- [Matt Pocock skills](https://github.com/mattpocock/skills)
- [`ask-matt` main workflow](https://github.com/mattpocock/skills/blob/main/skills/engineering/ask-matt/SKILL.md)
- [`grill-with-docs`](https://github.com/mattpocock/skills/blob/main/docs/engineering/grill-with-docs.md)
- [`research`](https://github.com/mattpocock/skills/blob/main/skills/engineering/research/SKILL.md)
- [`prototype`](https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md)
- [`to-spec`](https://github.com/mattpocock/skills/blob/main/docs/engineering/to-spec.md)
- [`to-tickets`](https://github.com/mattpocock/skills/blob/main/docs/engineering/to-tickets.md)
- [`implement-spec`](https://github.com/mattpocock/skills/blob/main/docs/engineering/implement-spec.md)
- [`domain-modeling`](https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/SKILL.md)
- [`retro`](https://github.com/mattpocock/skills/blob/main/skills/engineering/retro/SKILL.md)

**Status note:** This document specifies an experiment. It does not claim that Matt's skills have been installed, that a GitHub graph has been created, that the `kiss` branch has been reset, or that the assessment has passed a complete end-to-end test. No repository or branch modifications are authorized by this draft alone.
