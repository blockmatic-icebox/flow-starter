# Flow — Postmortem

**Date:** 2026-10-26  
**Status:** Working retrospective v5 — lessons and corrective direction; not an independent audit  
**Scope:** The Flow workflow/factory experiment and the Meta CTO agentic assessment built while that workflow was still being developed

## Executive summary

We started from a reusable technical foundation and made promising progress with an **agent-first, API/MCP-first approach** and test-driven development of agent and MCP behavior. The conversational agent is a particularly useful part of the solution. However, the overall assessment experience was not completed and validated to the desired product standard within the available timeframe. The intended complete triage journey, including any required review/confirmation and publishing behavior, should not be treated as proven simply because agents, tools, tests, or MCP connectivity work.

The largest failure was **product judgment and scope**, not the idea of agent-first engineering. We did too little investigation of comparable products, too little shared definition of domain language and user journeys, too little deliberate experience design, and too little firsthand validation of realistic scenarios. In parallel, we attempted to standardize a new development workflow by creating custom skills, coordination machinery, evaluations, and self-improvement loops. That work competed with the assessment itself. We took on too much for a narrow timeframe.

The resulting debt was largely **cognitive debt**: an expanding implementation whose intended user value, language, boundaries, priorities, and trade-offs had not been sufficiently understood and challenged by its human owner. Agent-generated artifacts and evaluation results sometimes stood in for decisions we should have examined ourselves.

**Core lesson:** Delegate investigation, testing, and implementation aggressively where useful, but never outsource acceptance of product direction. Exploit the starter's established technical defaults; specify **what outcome should exist**, enable agents to observe reality through trusted tools, and demand proof of a believable, complete user job before expanding scope or process infrastructure.

## What worked and should be preserved

### A reusable starter accelerated the technical work

- Starting from an existing TypeScript/agentic template was a sensible decision; rebuilding the entire foundation would have spent even more of the available time.
- API, MCP and agent capabilities as primary surfaces provided a reasonable architecture for a headless-first product.
- Reusability and technical sophistication were useful **foundations**, not evidence that the assessment's product was finished.

### Agent-first test-driven design was promising

- We focused early on agent behavior, tool calls, and MCP/API contracts, instead of testing everything only through a browser.
- Focused tests and contract-oriented implementation appear to have supported technical progress and are worth retaining.
- A passing unit/protocol test is not evidence that the complete task-triage journey works in a real client; each conclusion needs its own proof.

### Conversational access was valuable

- Being able to discuss tasks and issues with the agent is one of the aspects the owner finds most compelling.
- MCP connectivity was subsequently reported working during cloud/ChatGPT experimentation; compatibility and individual calls can be promising while **end-to-end triage, corrections, confirmation/publishing, and usability remain separately unverified**.

## What went wrong

### 1. The scope exceeded the available time

We tried to deliver a reusable starter, a functioning assessment solution, a new development methodology, a parallel agent factory, evaluation infrastructure, and self-improvement mechanisms within the same constrained window. This split attention between solving the actual user problem and developing the means of developing it. Features such as insights and richer dashboards competed with the essential **task-creation and triage** journeys.

**Lesson:** Define the wider problem and capabilities enough to avoid incompatible contracts, but implement and verify **one small, complete outcome at a time**. Explicitly defer secondary features; don't silently drop requirements that remain in the agreed scope.

### 2. We tried to invent and validate a workflow while using it

The assessment arrived while our personal development workflow was still being standardized. We had experimented with multiple skills and processes, but had not established a trusted, efficient default. Flow became increasingly ceremonial: special routing, approval gates, roles, document types, worktree coordination and extensive evaluation code. We spent disproportionate effort on proving and refining the methodology before demonstrating that it improved delivered product outcomes.

**Lesson:** For the next experiment, adopt **Matt Pocock's existing skills and workflow directly**, using their native interview, domain-modeling, specification, ticket, TDD, prototype, review and retrospective methods. Avoid a replacement Flow skill, custom router, harness, or comparative evaluation program. Test existing skills through one real feature before adapting them.

### 3. We trusted autonomous evaluation and self-improvement too much

Our attempt to remove the human bottleneck put too much faith in agents evaluating other agents and improving the factory. More workers, scoring, green harness checks, or extensive documentation did not resolve questions about whether the product was right for its users. Findings were not consistently distilled into decisions the owner understood and accepted. Prompt/run logging also had gaps: not all agents, including Codex, were captured consistently, and model provenance was missing in some records.

**Lesson:** One accountable main agent should synthesize subagent findings, surface important disagreements, and present concise recommendations and supporting evidence. Humans own consequential product choices. Report real skills, client, model when available, tests and observed outcomes; unknown provenance remains unknown. No new cross-client logging framework is needed just to restart development.

### 4. We underinvested in product-solution research

We did not sufficiently inspect how existing applications and open-source projects solve similar user problems, which workflows and interface patterns work, or which success signals actually matter. We tended to jump from hypothetical requirements to implementation. The missing research was mainly **product and experience research**, not market sizing or a mandatory business plan.

**Lesson:** Before committing to a consequential direction, research relevant existing solutions **when the findings could change the choice**. Compare actual user journeys, interaction patterns, terminology, and trade-offs, not just technology stacks. Have the agent bring back a sourced shortlist and recommendation. Retain research in a dated Markdown note when it will be reused; otherwise preserve the findings in the relevant GitHub discussion or decision.

### 5. We did not agree on the domain and primary user journeys

Glossary/taxonomy material was generated more quickly than it was reviewed. Terms such as _request_, _task_, _triage_, _severity_, _status_, _confirmation_, and _publication_ need precise meanings because they affect the data model, MCP contracts and interactions. We also insufficiently defined the main end-to-end jobs, including review/correction paths and failure states.

**Lesson:** Clarify the domain with concrete scenarios and edge cases **with the human**, then capture only resolved terms. Matt's `grill-with-docs` and `domain-modeling` can maintain a glossary and sparse ADRs as decisions emerge, but a file's existence is never proof that the owner reviewed or accepted its contents. The initial spec should explain the core jobs and boundaries without requiring the implementation of every job at once.

### 6. Visual and interaction design were treated too late

We depended heavily on generic or agent-generated UI rather than investigating relevant product patterns, references and distinct design alternatives. We lacked adequate prototyping and hands-on assessment of the actual flow. The owner is not satisfied with the current application UX and cannot yet comfortably use it for the intended end-to-end work. **This was the clearest product-quality failure**, even though the agent/MCP direction had value.

**Lesson:** User journeys are not synonymous with web pages. A headless chat/MCP workflow still needs interaction design—input language, responses, review, corrections, consent, recoverable errors. When a visual app is in scope, explore real references and prototype alternative experiences before significant UI investment. Validate technical capability and product usability separately.

### 7. Synthetic data and suggestions did not represent believable users

The demo became too self-referential, and seed requests/suggested prompts sometimes read like internal test cases instead of natural human requests. Some generated suggestions contained JPEG/PNG/file-reference artifacts or artificial numbering. Personas were insufficiently differentiated, and the example context shifted between hypothetical projects. Generating data successfully was mistaken for generating **representative product scenarios**.

**Lesson:** Choose **one coherent example product**, a small set of realistic personas and situations, and natural language grounded in their needs. Review suggested prompts and seeded content as if a real user wrote them. Prevent accidental attachment/file references, robotic numbering, and recursive meta-demo language. Seed fixtures must support the exact journeys and edge cases under test; realistic test inputs and deterministic checks serve different purposes.

### 8. We verified components more than complete user outcomes

We made progress on agents, MCP endpoints, database contracts and tests, but did not complete a firsthand demonstration of the entire intended triage journey to the required standard. A database-only or tool-only test can retire a technical risk; it cannot establish a finished user job. It is valid to deliver an **API/MCP-first vertical slice** without building a custom web UI, provided a user can complete and observe the outcome through an actual supported client.

**Lesson:** For each slice, name the entry point, behavior, persisted state, visible result, recovery path, and independent verification. Distinguish (1) technical behavior, (2) a completed real-client user journey, and (3) quality of the intended web experience.

### 9. We specified process mechanics more than observable outcomes

The starter already provided many architectural and tooling defaults, but attention drifted toward how subagents should work, how the workflow should be routed and how the workflow itself should be evaluated. We did not consistently frame tasks in terms of a real actor, their intended completed job, and **observable proof** in the running product. As a result, engineering activity and technically correct intermediate artifacts could accumulate without resolving the essential user experience.

**Lesson:** Prompt the **what**—user job, expected outcome, constraints, acceptance and evidence—while letting agents use the verified architecture and established practices. Keep enough technical constraints to protect safety and contracts. When uncertain about the right interaction or demo content, use a small comparative prototype or reviewable set of alternatives to make a timely human choice instead of a long chain of unreviewed single-output iterations.

### 10. Our end-to-end feedback loop was not consistently observable

We had technical tests and MCP integration work, but did not consistently require each meaningful feature to be **run, observed and demonstrated** through the full path from user/client request to agent/MCP behavior, logs, persisted state and user-visible result. Some of those capabilities may already have existed; the gap was a reliable practice and evidence standard, not necessarily missing tooling. We should not mistake a claimed tool call, green test or successful connection for independently verified product behavior.

**Lesson:** Give coding agents reliable access to approved local startup/test commands, official CLIs, MCP inspection, scoped logs and database reads, plus the actual supported client when relevant. A completion report should distinguish **Implemented, Verified and Unverified** and include reproducible checks instead of assertions. Assess client tool support and MCP App UI rendering separately. Focus deep review on high-risk contracts, migrations, permissions, destructive operations and side effects.

### 11. Tool access needs a supply-chain and identity boundary

Making the SDLC operable does **not** mean granting agents blanket software installation or credential permissions. Developer ecosystems have meaningful supply-chain risks; package installation scripts and untrusted binaries can execute code even when authentication is well managed. This is a preventive lesson for the next trial, **not a claim that a package compromise or credential incident caused this assessment's failure**.

**Lesson:** Discover existing trusted CLIs and MCP/plugin integrations first. Prefer official installation sources, controlled dependency versions, reviewed install scripts and least-privilege authorization. Distinguish interactive OAuth/SSO sign-in from workload OIDC federation, which should use short-lived credentials only when supported. Keep tokens out of prompts/logs, prefer scoped read-only inspection and request human approval for consequential writes. Avoid developing a universal CLI/MCP manager as a reaction to the risk.

## Root cause: cognitive debt and misplaced priorities

We attempted to move faster by minimizing human interruptions and increasing agent autonomy. But we lacked an agreed, testable answer to foundational product questions: **Who is this for? What is the first job they need to complete? What existing solutions suggest better patterns? What do our domain terms mean? What does a believable request look like? Which outcomes matter? What would make this experience genuinely usable?**

Those unresolved questions accumulated while code, tests and process artifacts expanded. The owner became a bottleneck in product decisions; the remedy is **better-prepared, narrower human decisions**, not eliminating the human from them. The late discovery of UX and seeded-data problems is evidence that autonomous technical checks alone were insufficient.

## Practical product-development lessons for the next attempt

These are **decision prompts, not mandatory phases or files**. Use them in proportion to the uncertainty and stakes of a project or feature.

| Product question | Lightweight practice | Evidence we want |
| --- | --- | --- |
| **Who and why?** | State the target actor, problem, primary job and intended benefit | One crisp user outcome, not just a feature list |
| **What already works elsewhere?** | Investigate comparable products and actual UX patterns where relevant | Sourced examples, alternatives, and an explicit choice |
| **What is the shared language?** | Clarify core entities, states, relationships and ambiguous words with real cases | Human-reviewed terminology that matches API/MCP/data behavior |
| **What's the first complete journey?** | Write the request → action → result → correction/failure path | An executable real-client scenario with acceptance criteria |
| **What does success mean?** | Select observable prototype outcomes or meaningful product metrics, not invented KPIs | A falsifiable acceptance check and appropriate later measures |
| **What would believable data look like?** | Choose one example product, distinct personas and authentic-looking requests | Human-reviewed samples covering main and edge scenarios |
| **What experience should this be?** | Use references and prototypes for UX questions that cannot be settled in prose | Human feedback on interaction and visual direction when UI exists |
| **What can wait?** | Set a strict first slice and defer optional insights/polish | A small demonstrable scope with explicit non-goals |
| **Does it actually work?** | Use agent/MCP TDD plus real client walkthrough and manual usability review | Honest separate claims for tests, full journey and UX |
| **Can the agent see the system?** | Give it approved commands for startup, logs, tool calls and scoped state checks | A reproducible request-to-result trace and declared gaps |
| **How do we know it is done?** | Ask for Implemented / Verified / Unverified in issue/PR summaries | Specific observed proof, not a self-reported green status |
| **Are its tools trustworthy?** | Discover official CLI/MCP integrations; install and authenticate conservatively | Verified install source, least privilege, no secrets in outputs |

Research is evidence about alternatives, **not evidence that customers want the product**. Metrics are useful when a product decision needs them; a prototype can use a concrete scenario and success condition instead of a business KPI. Don't require product-design documents or brand exploration before a headless technical slice when they do not answer the immediate risk.

## Recommended operating direction (proposed, not proven)

- **Adopt Matt Pocock's workflow rather than a new Flow methodology.** Use `grill-with-docs` for conversational domain/decision work, `research` and `prototype` when uncertainty justifies them, `to-spec`/`to-tickets` for multi-session work, `implement` or `implement-spec` according to task graph and actual worker capability, followed by real tests, review and `retro`. Avoid requiring the whole chain for small changes.
- **GitHub Issues owns tracked work:** a spec Issue captures agreed scope and intent; sub-issues and native blockers express implementable slices. A direct fix can skip issues. Don't also maintain `tasks/todo.md` or duplicate Markdown specs.
- **Keep three short current-state entry points** in the repository: `PRODUCT.md`, `DESIGN.md` and `ARCHITECTURE.md`, reflecting accepted and verified reality. Link to GitHub issues, PRs and consequential decisions. In the same PR as a material change, update affected summaries; flag divergence before treating unexpected code behavior as approved direction.
- **Preserve consequential decisions** in one numbered ADR sequence, with product and technical decisions together, and resolved domain vocabulary in a glossary only when it adds real clarity. Prefer Matt's default artifact locations initially to avoid unnecessary workflow overrides.
- **Prompt for outcomes, not implementation choreography.** The boilerplate supplies established architecture; the human defines the intended user job, constraints and acceptance. Where alternatives matter, ask for a small comparison/prototype rather than repeatedly iterating blindly.
- **Make the local SDLC observable with trusted tools:** reuse documented project commands, official CLIs, native MCP/managed integrations, logs and scoped state inspection. Verify a real user journey and capture Implemented / Verified / Unverified; do not introduce a custom wrapper around each tool.
- **Treat tool installation and identity as security controls:** prefer verified packages and approved scripts, interactive OAuth/SSO for users and supported short-lived OIDC for workloads; limit access and approve consequential actions. This is preventive guidance rather than a claimed past root cause.
- **Use parallel agents for bounded, genuinely independent tasks**, not for inflating activity counts. The main agent integrates work and evidence; the human accepts consequential product choices.
- **Keep retrospective learning lightweight.** Matt's `retro` should recommend narrowly scoped improvements to the agent environment after real failures. No automated self-healing/evaluation factory is part of this reset.

## What we will not claim

This postmortem is a self-assessment based on observed experience, not a scored external audit. It does **not** establish that every MCP host, triage flow, publication action or UX path was verified; it does not claim the new Matt-based workflow has already succeeded, that every tool/client supports the same MCP and UI capabilities, or that its automation is reliable in every client. These require explicit observation in the next experiment.

## Follow-through

The companion [Matt Skills Adoption experiment PRD](simplified-flow-prd.md) turns these lessons into a **small manual product-development trial**, rather than another custom process project. The next meaningful evidence is a complete, credible, agent-first user journey with real-client verification and a clear review of product quality. Do not expand the process or scope before obtaining that evidence.
