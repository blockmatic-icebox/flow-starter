Date: 2026-10-24

# Flow — Product development workflow

Version: 0.1

Flow is a lightweight product engineering workflow for humans and coding agents. It connects exploration, product decisions, design, engineering, review, shipping, and learning without requiring a separate project management system.

This file defines workflow conventions for any product using Flow. It does not describe the product being built. In this repository, Flow ships inside **Flow Factory** ([factory.md](factory.md)); stack-specific rules also appear in [AGENTS.md](../../AGENTS.md).

### Where detail lives (read progressively)

| Topic | Canonical owner |
| --- | --- |
| Coordinator entry | [.agents/skills/flow/SKILL.md](../skills/flow/SKILL.md) |
| Delegation and subagents | [operations/delegation.md](operations/delegation.md) |
| Parallel worktrees | [operations/worktrees.md](operations/worktrees.md) |
| Verification | [operations/verification.md](operations/verification.md) |
| Task report and prompt log | [operations/journal.md](operations/journal.md) |
| Skill routing | [operations/skills.md](operations/skills.md) |
| Human-oriented intro | [guides/working-with-flow.md](guides/working-with-flow.md) |
| Dogfooding → evaluation | [guides/dogfooding-eval.md](guides/dogfooding-eval.md) |

## Operating model

**Explore → Specify → Plan → Build → Review → Ship**

These are activities, not mandatory checkpoints for every change. Start at the activity the work needs, move backward when uncertainty appears, and revisit earlier decisions when evidence changes.

Use the least process necessary to learn or deliver something valuable.

A small, well-understood bug fix may go directly to Build → Review → Ship. A new product direction may require exploration and several rounds of specification before implementation.

## Kinds of work

Classify the task before choosing ceremony. All kinds use the same lifecycle activities; they differ in how much discovery and documentation apply.

### New product

Starting from an idea, customer problem, or existing brief: understand the problem and users, establish direction and meaningful requirements, make design and architectural decisions, plan a small useful slice, implement and verify, deliver, and capture product outcome evidence when available. Use existing templates and document conventions. Do not invent customer requirements or force every initiative through every stage. Substantial briefs still begin in Explore; **Build** still requires explicit implementation authorization.

### Existing product

For an application already in this repository: implement features, fix bugs, refactor safely, improve performance, maintain architecture, integrate services, review, and ship. Choose the smallest relevant activity. A straightforward bug fix does not trigger a full product-discovery process.

### Flow improvement

Improvements to Flow skills, orchestration, evaluation, or methodology documentation are ordinary Flow work with subject matter Flow itself. Use the user-invoked `flow-improve` skill; do not open a second self-improvement lifecycle. Experiments run in isolated worktrees and integrate under existing authorization. Product work does not pause for methodology improvement unless the human prioritizes it.

## Natural-language initiation and human approval

Flow stages are selected by intent, existing context, uncertainty, and explicit authorization. They are not selected exclusively by keywords or slash commands.

A new substantial product problem normally begins in Explore, even when the user supplies an existing assessment, request for proposal, or extensive business brief.

A standalone repository setup instruction is handled as setup. It does not automatically trigger product discovery.

### Starting from an existing brief

1. Read the supplied source material before interviewing the user.
2. Extract explicit requirements without silently expanding or rewriting them.
3. Identify already accepted decisions and preserve them.
4. Distinguish missing information from implementation details that can safely remain undecided.
5. Identify consequential uncertainty about users, jobs to be done, permissions, workflows, success criteria, constraints, and risks.
6. Ask a small group of prioritized questions that materially affect product decisions.
7. Avoid questions already answered by the brief or repository.
8. Use research when it can resolve consequential uncertainty; record source-backed findings when they are worth preserving.

Do not automatically convert every open question into a blocking question. Make reasonable technical recommendations when appropriate, label assumptions, and request decisions only when they matter.

### Explore approval checkpoint

Before advancing a substantial new-product initiative to Specify, present a concise decision summary containing:

- The problem and intended outcome.
- Known users and their primary jobs.
- Explicit requirements.
- Proposed scope and non-goals.
- Proposed decisions requiring human approval.
- Unresolved assumptions or risks.
- The recommended next stage.

A proposal is not an accepted decision merely because an agent wrote it.

Request explicit approval when the proposed decision is consequential or changes accepted direction.

If the user has already approved particular decisions, preserve them without asking again.

Explore may iterate until enough information is available. It does not require documentation generation by default.

### Specify approval checkpoint

After the relevant decisions are approved:

1. Update the owning canonical documents.
2. Record bounded initiative requirements in the initiative document when justified.
3. Create a separate specification only when its detail cannot be represented clearly in the owning document.
4. Define functional and nonfunctional requirements, meaningful edge cases, and observable acceptance criteria.
5. Identify outstanding decisions that prevent implementation.
6. Request approval of the proposed scope and requirements before planning substantial implementation work.

Do not create multiple PRDs, specifications, or decisions that describe the same facts.

### Plan approval checkpoint

For substantial new-product work, produce a plan that identifies:

- The smallest useful vertical slice.
- Implementation boundaries and likely files.
- Dependencies and execution order.
- Data, identity, authorization, and integration considerations.
- Applicable agent and API capabilities.
- Automated tests and human verification.
- Measurable acceptance criteria.
- Known risks and trade-offs.
- Documentation updates required during Build.

Store sustained initiative tasks and progress in the owning initiative, including the plan for bounded work. Use a standalone plan only when justified by the existing document conventions. Do not create both `docs/initiatives/<slug>.md` and `docs/plans/<slug>.md` for the same scope by default.

Present the plan for human review.

Approval of a proposed plan and authorization to execute it are distinct when the user's intent is ambiguous.

Phrases such as "help us implement this properly," "build this feature," "build it now," "skip the process," or "update everything" start **Specify** or **Plan** for substantial new work. They do not authorize **Build**. **Build** starts only after a later message that explicitly authorizes implementation. A small, well-understood bug fix with an explicit fix request (for example, "please fix it") may go directly to **Build** when proportionality applies.

**Do not begin Build for a substantial new-product initiative without explicit implementation authorization.**

If the user requests modifications to the plan, remain in Plan.

### Proportionality and continuation

These checkpoints apply to substantial new-product work and consequential changes. They do not require a discovery interview, initiative file, or approval ceremony for every small bug fix.

At the end of a discovery, specification, or planning response, make the current stage, accepted decisions, unresolved questions, and next approval or action clear.

If new evidence invalidates an accepted decision, return to the relevant earlier stage and request authorization to revise it.

Do not manufacture certainty or claim that repository instructions can technically force a model to obey these rules. Verify actual agent behavior separately.

## Authority and responsibilities

- **Human intent:** Explicit requests, approvals, and accepted project decisions determine what work is authorized.
- **Project contracts:** `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, and `GLOSSARY.md` describe current accepted direction.
- **Flow:** This file determines the workflow, ownership of information, document locations, and naming conventions.
- **Skills:** Installed skills provide specialized methods for exploration, validation, requirements, planning, implementation, and review.
- **Code and tests:** Establish observed implementation behavior, but do not automatically override accepted product intent.

If a skill prescribes an output path or naming pattern that conflicts with Flow, retain the skill's useful method and write its output to Flow's canonical location.

If a skill's mandatory workflow cannot be performed in the available environment, explain the limitation and use an applicable installed alternative. Never claim that a skill was executed when it was not.

Never silently reverse an established project decision. Surface the conflict and seek authorization before changing that decision. A request that conflicts with an accepted ADR or PDR is not **Build** authorization and does not permit rewriting accepted decision records or their implementing boundaries in that turn. See [AGENTS.md](../../AGENTS.md) for stack-specific examples in this repository.

## The workflow

### 1. Explore

**Purpose:** Understand opportunities, assumptions, risks, and alternatives without prematurely committing to a solution.

Use when the problem is unclear, meaningful uncertainty exists, or the user explicitly asks to brainstorm, research, compare, or validate.

Possible activities:

- Refine the problem and intended audience.
- Compare possible approaches.
- Identify risky assumptions.
- Research evidence, alternatives, and constraints.
- Design a small experiment or prototype.
- Preserve a worthwhile idea without committing to implementation.

**Exit condition:** Either identify a useful next action, establish enough clarity to specify work, or deliberately defer/stop.

**Documentation:** Usually none. Persist useful uncommitted ideas or durable evidence only when worth preserving.

Parallel discovery: [delegation.md](operations/delegation.md#explore).

### 2. Specify

**Purpose:** Agree on the outcome, scope, behavior, and acceptance criteria before substantial implementation.

Use when introducing a capability, changing important user behavior, or resolving ambiguous requirements.

Define as appropriate:

- Problem and desired outcome.
- Intended users or consumers.
- In scope and out of scope.
- Required behavior and important edge cases.
- Acceptance criteria.
- Consequential assumptions and open questions.
- Validation approach when customer-value uncertainty matters.

Use existing `PRODUCT.md` for product-wide direction. Create an initiative document for bounded work that needs a durable owner. Create a separate technical or functional spec only when it adds information not already covered by the initiative.

**Exit condition:** The work is clear enough to plan or implement, and any decision requiring human approval is resolved.

Dimensional specification without duplicate doc edits: [delegation.md](operations/delegation.md#specify).

### 3. Plan

**Purpose:** Choose an implementable approach with appropriate risk and verification boundaries.

Inspect existing architecture and code before proposing new abstractions.

Plan only as deeply as the work requires:

- Dependencies and implementation order.
- A small vertical slice when possible.
- Files and interfaces likely to change.
- Testing and verification approach.
- Relevant security, accessibility, performance, and operational risks.
- Documentation impact.
- Explicit acceptance checks.

For a small task, a concise plan in the conversation is sufficient. For sustained initiative work, keep the plan and task progress in its initiative document. A standalone plan is exceptional, not the default. Add `docs/plans/<slug>.md` only when the initiative cannot hold that plan or the user asks for a separate plan document.

**Exit condition:** The first implementation slice is unambiguous and verifiable.

For substantial initiative work, record parallel execution as **waves** in the owning initiative (`## Waves`). Before plan approval, run a **contrarian wave** (question-mode worktrees) when meaningful alternatives or unvalidated assumptions remain; capture assumptions, kill criteria, and the recommended direction in the initiative. After explicit **Build** authorization, the coordinator uses `pnpm --dir .agents worktrees` to prepare ready tasks, run workers in isolated checkouts, verify results, and serialize integration into local `main`. Procedure and task format: [.agents/flow/operations/worktrees.md](operations/worktrees.md).

Dependency-aware planning and parallel investigation: [delegation.md](operations/delegation.md#plan).

### 4. Build

**Purpose:** Implement the smallest useful change consistent with accepted decisions.

- Follow the existing stack and repository architecture.
- Prefer existing abstractions and established patterns.
- Use applicable development and testing skills.
- Implement or update tests at the appropriate boundary.
- Keep changes scoped to the agreed outcome.
- Update the owning documentation when behavior or accepted direction changes.
- Do not modify unrelated files for incidental cleanup.
- For multi-file or planned slices, apply `incremental-implementation` (see [skills.md](operations/skills.md)).

**Exit condition:** The agreed slice is verified and integrated into local `main` (or explicitly blocked with a recovery path). A worker exit alone is not completion.

After implementation authorization, the coordinator automatically launches ready independent tasks in isolated worktrees, verifies each result, and integrates accepted work into local `main` one task at a time. GitHub publication remains optional and separately authorized.

Build waves and parallel builders: [delegation.md](operations/delegation.md#build).

### 5. Review

**Purpose:** Verify correctness, coherence, and alignment with intent.

Review:

- Acceptance criteria and edge cases.
- Tests and relevant quality checks. When reporting that checks passed, name each command and its exit code, or state what was not run.
- Security and permission boundaries where applicable.
- Accessibility, interaction, and responsive behavior where applicable.
- Compatibility with established architectural decisions.
- Unnecessary complexity or duplicate concepts.
- Documentation accuracy and location, including product contracts when behavior or accepted direction changed.
- Remaining limitations.
- Unresolved mismatches between code and `PRODUCT.md`, `DESIGN.md`, or `ARCHITECTURE.md`.

A working implementation does not itself prove that the feature created customer value. Keep technical verification distinct from product validation.

**Exit condition:** Important issues are addressed or explicitly disclosed.

#### Diff-scoped review before an authorized commit

Before an explicitly authorized commit, inspect the staged diff and changed-file list. Read only the product, design, architecture and decision contracts affected by those changes. Check for contradictions, unrelated modifications, missing tests, undocumented behavior changes and secrets. Run applicable deterministic checks. Do not expand the review to the entire repository without evidence that the change crosses a broader boundary.

Implementation authorization includes scoped local task-branch commits and serialized integration commits into local `main` for accepted work. Never push without explicit authorization.

Security-sensitive changes — request boundaries, authorization, secrets, GenUI validation, database credentials — also require the [Factory security model](security/security-model.md) and the tests that cover the changed boundary.

Automatic checks prove deterministic behavior. They do not replace judgment about product intent, threat model, or whether a change belongs in the commit.

Do not execute a model to validate behavior that a deterministic test, compiler, or schema can decide.

Independent verification when warranted: [delegation.md](operations/delegation.md#review).

### 6. Ship

**Purpose:** Deliver the agreed change and preserve enough context for continued work.

- Run the applicable repository checks.
- Report what changed.
- Report the actual tests and outcomes.
- State any unverified behavior and follow-up work.
- Update initiative status and findings if an initiative exists.
- Update accepted project contracts when decisions or intended behavior changed.
- Capture product outcome evidence when available; otherwise state what remains unknown.

When the task warrants it, answer three separate questions without adding a new lifecycle stage:

1. **Technical acceptance** — Did the change meet acceptance criteria and reported checks?
2. **Product outcome** — Did it achieve the intended user or business outcome, or is that still unknown?
3. **Workflow friction** — Did the development process itself suggest a recurring methodology issue worth a later user-invoked `flow-improve` pass? Record the observation; do not expand scope into self-improvement during ordinary product delivery.

New product or market evidence may send work back to Explore; that is continuation within the lifecycle, not a seventh stage.

Do not declare something shipped merely because code was written. Publishing to a remote, opening a pull request, and deploying require the appropriate user authorization and environment. Integrating verified work into local `main` during authorized **Build** is not publication.

Parallel readiness checks and honest release boundaries: [delegation.md](operations/delegation.md#ship).

## Documentation ownership

Use one authoritative home for each fact. Link related documents instead of copying their contents.

Flow Factory's mission, goals, and inherited foundation are explained in [factory.md](factory.md). Before adoption, the root `README.md` introduces Flow Factory and the installer; after adoption it belongs to the generated product. Flow methodology and documentation conventions belong in `.agents/flow/flow.md`, with a human introduction in `.agents/flow/README.md`. Additional pages linked from that introduction (for example `working-with-flow.md`, `principles.md`, `influences.md`, `project-context.md`, and `improvement.md`) explain the methodology for people; they do not change the rules in this file. **Product** current architecture belongs in root `ARCHITECTURE.md`. **Factory** inherited architecture belongs in [architecture.md](architecture.md). Durable rationale belongs in ADRs and PDRs under the correct owner. Use existing initiatives, plans, and specifications only when justified by the work.

| Location | Responsibility |
| --- | --- |
| `AGENTS.md` | Lightweight agent entrypoint and task-specific document routing |
| `README.md` | Factory introduction before adoption; product development README after adoption |
| `.agents/flow/factory.md` | Flow Factory mission, capabilities, adoption, and navigation |
| `.agents/flow/architecture.md` | Inherited Factory technical architecture and implementation boundaries |
| `.agents/flow/flow.md` | Workflow, skill orchestration, document conventions, and lifecycle |
| `.agents/flow/README.md` | Human-facing introduction to the Flow methodology |
| `PRODUCT.md` | Current product vision, audience, business context, scope, outcomes, and capabilities |
| `DESIGN.md` | Current visual, interaction, experience, and accessibility direction |
| `ARCHITECTURE.md` | Current **product** technical structure, boundaries, and deviations from Factory defaults |
| `GLOSSARY.md` | Terms with project-specific meanings and consequential distinctions |
| `docs/ideas/<slug>.md` | Worthwhile possibilities that are not yet implementation commitments |
| `docs/initiatives/<slug>.md` | Product bounded work: outcome, scope, assumptions, tasks, progress, validation, and findings |
| `.agents/flow/initiatives/<slug>.md` | Factory engineering and methodology bounded work |
| `docs/research/YYYYMMDD-<slug>.md` | Product research and evidence |
| `.agents/flow/research/YYYYMMDD-<slug>.md` | Factory technical and methodology research |
| `.agents/flow/guides/` | Human-facing methodology pages (do not override this file) |
| `.agents/flow/operations/` | Delegation, worktrees, skills, verification, domain context |
| `docs/specs/<slug>.md` | Product capability contracts when justified |
| `.agents/flow/specs/<slug>.md` | Factory-wide capability specifications (for example GenUI) |
| `docs/plans/<slug>.md` | Optional standalone implementation plans when an initiative would be insufficient or inappropriate |
| `docs/pdr/NNNN-<slug>.md` | Product decision records (independent numbering) |
| `docs/adr/NNNN-<slug>.md` | Product architecture decision records (independent numbering) |
| `.agents/flow/decisions/pdr/NNNN-<slug>.md` | Factory product-engineering decision records |
| `.agents/flow/decisions/adr/NNNN-<slug>.md` | Factory architecture decision records |
| `.agents/flow/security/` | Factory security architecture and implementation model |

These directories are created only when the first useful document needs them.

Application tests belong alongside the implementation or in the repository's established test locations. Verification findings belong with the work that they verify. Do not introduce a generic `docs/testing/` or `docs/release/` folder by default.

Do not create another `PRD.md`, `SPEC-*.md`, `PLAN-*.md`, `INITIATIVE-OVERVIEW.md`, or similarly named parallel source of truth.

A PRD is a type of product requirements content, not a mandatory separate filename. Place current product-wide requirements in `PRODUCT.md`; place bounded initiative requirements in the initiative or a justified capability spec.

A PDR is a Product Decision Record. An ADR is an Architecture Decision Record. Both preserve consequential rationale, not the entire current product or architecture specification.

### Contract maintenance

Product documentation is a maintained engineering contract, not an initialization artifact. During Explore, Specify, Plan, Build, Review, and Ship, the coordinator must assess whether new evidence, accepted decisions, or implementation changes affect `PRODUCT.md`, `DESIGN.md`, or `ARCHITECTURE.md`. Update the owning document in the same work when material facts change, without manufacturing decisions or duplicating initiative-level details. At Review and Ship, reconcile current code, accepted direction, and documentation; report unresolved mismatches rather than silently changing approved intent.

Update triggers:

- **`PRODUCT.md`** — product-wide purpose, audience, scope, capabilities, requirements, non-goals, or success criteria materially change.
- **`DESIGN.md`** — visual direction, design tokens, components, interaction conventions, accessibility rules, responsive behavior, or meaningful UX direction changes. Visual references may be captured during Explore without a full user journey.
- **`ARCHITECTURE.md`** — implemented system boundaries, routes, integrations, data models, package responsibilities, security architecture, or significant implementation constraints change. Not every implementation detail deserves a root architecture update.

**Design implementation sync:** `DESIGN.md` owns human-readable visual and interaction decisions; `packages/ui/src/styles/globals.css` and related UI files own token and component values. A meaningful UI-system change requires assessing and updating `DESIGN.md` in the same change. An accepted design change that affects implementation must propagate into the relevant UI files during authorized **Build**. Report discrepancies; do not conceal them.

For product work, read the current contents of `PRODUCT.md`, `DESIGN.md`, and `ARCHITECTURE.md` before consequential recommendations or implementation decisions. Delegated workers receive relevant contract paths or concise scoped context.

Before declaring substantial work complete, assess: (1) implementation matches the accepted product contract; (2) interaction/UI matches `DESIGN.md`; (3) `ARCHITECTURE.md` describes the actual system; (4) consequential accepted decisions are recorded correctly; (5) relevant documents were updated with the code; (6) proposed decisions remain clearly identified as proposals.

## Naming conventions

For new documents:

1. Use lowercase `kebab-case` slugs.
2. Use `.md` for Markdown documents.
3. Use four-digit sequential numeric prefixes for new PDRs and ADRs: `0001-`, `0002-`, and so on.
4. Use ISO dates for durable research: `YYYYMMDD-<topic>.md` (compact date prefix, no hyphens in the date).
5. Do not introduce uppercase document-type prefixes such as `SPEC-`, `ADR-`, `PLAN-`, or `CAPABILITIES-`.
6. Keep one document per meaningful concern.
7. Do not create empty placeholder documents or directories.
8. Do not rename historical documents merely to satisfy a new convention. Preserve references and update historical material only through an explicit migration.

For ADRs and PDRs, use the next unused number **within each namespace** after the largest existing numeric identifier in that namespace, regardless of whether older files use three or four digits.

## Decision routing

Classify ownership before writing a record:

1. Changes Flow methodology, agent skills, delegation, evaluation, or workflow behavior → Factory (`.agents/flow/`, skills, operations).
2. Changes reusable Factory technology, architecture, tooling, or security defaults → Factory ADR/PDR/spec under `.agents/flow/`.
3. Changes the specific product's domain, users, requirements, or chosen deviations → product `docs/` or root contracts.
4. Product-specific departure from a Factory default → product ADR in `docs/adr/`, explicitly referencing the inherited Factory ADR.
5. Both Factory and product implications → separate responsibilities; do not duplicate the same decision in two places when one owner is clear.

Relocating an accepted Factory decision does not reverse it. Changing Factory architecture requires the Factory decision process. Products may override inherited defaults through an accepted **product** ADR without rewriting Factory history.

## Context efficiency

Do not load every Factory ADR for ordinary product work. Read product contracts (`PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, relevant `docs/`) and implementation first. Read [architecture.md](architecture.md) or specific Factory ADRs only when a change touches an inherited boundary.

## Decision records

Create a decision record only when the decision is meaningful, difficult to reverse, has real alternatives, and would be surprising without recorded context.

Store **product** ADRs in `docs/adr/` and **Factory** ADRs in `.agents/flow/decisions/adr/`. Store **product** PDRs in `docs/pdr/` and **Factory** PDRs in `.agents/flow/decisions/pdr/`. Factory and product ADR/PDR numbers are **independent** (the same numeric id may exist in both trees). Do not use `docs/decisions/`, `ADR-001` filenames, or uppercase type prefixes.

Use this structure for every new ADR and PDR:

```markdown
Date: YYYY-MM-DD

# ADR 0001 — Title

**Status:** Accepted

## Context

## Decision

## Alternatives considered

## Consequences

## Related documents
```

Replace `ADR` with `PDR` for product decisions. Use four-digit ids in titles (`ADR 0003`, not `ADR 003`).

**Status** must be exactly one of: `Proposed`, `Accepted`, `Superseded by ADR NNNN`, or `Deprecated`. Record the decision date only in the `Date:` line, not in **Status**.

Rationale and alternatives belong in the record. Current **product** implementation detail belongs in [ARCHITECTURE.md](../../ARCHITECTURE.md) or product `docs/specs/`. Current **Factory** implementation detail belongs in [architecture.md](architecture.md), [.agents/flow/specs/](specs/), or [security/security-model.md](security/security-model.md).

Preserve previous accepted decisions as historical records. If a decision changes, write a superseding record and update the current owning document.

Do not write ADRs or PDRs for routine tasks, obvious code, or ordinary clarification.

## Skill selection

Choose the **smallest** installed skill set that matches intent and uncertainty. Do not load the full catalog for every task.

Principles:

- Read a skill's `SKILL.md` before claiming it ran.
- Apply Flow document ownership and naming to skill outputs.
- Explicitly requested skills take precedence when installed and applicable.

The task-to-skill map lives in [.agents/flow/operations/skills.md](operations/skills.md). Skill installation does not imply execution.

## Documentation discipline

Write for humans and agents using progressive disclosure.

### Research and specification metadata

Research documents must include concise metadata near the beginning:

- **Research date:** `YYYY-MM-DD`, or `Unknown (legacy)` when the original date cannot be verified.
- **Last reviewed:** `YYYY-MM-DD`
- **Status:** `Current`, `Historical`, or `Exploratory`

For new research files, the date in the filename (`docs/research/YYYYMMDD-<slug>.md`, interpreted as `YYYY-MM-DD` in metadata) must match **Research date**.

Legacy research paths without dated filenames may remain; they still require metadata.

Specifications must include:

- **Last reviewed:** `YYYY-MM-DD`
- **Status:** `Current`, `Historical`, or `Draft`

An optional **Created** field is permitted when the creation date is known. Do not fabricate dates.

Metadata records when evidence was gathered or the document was last reviewed, not that every external claim was reverified.

- `AGENTS.md` should route readers instead of reproducing every rule.
- Read only the documents relevant to the task.
- Prefer concise current contracts over exhaustive repository descriptions.
- Keep intent, decisions, and implementation aligned.
- Do not rewrite accepted intent merely to match accidental code behavior.
- Preserve durable findings and links to their sources.
- Keep speculative ideas distinct from approved work.
- Do not turn every task or observation into documentation.

The source code remains discoverable. Document the non-obvious intent, trade-offs, constraints, and decisions that are costly to reconstruct.

ARCHITECTURE.md describes technical structure and constraints. Initiative documents own bounded implementation scope and detailed execution progress. Optional plans and specifications cover justified planning detail. Avoid duplicating the same task list across these documents.

## Enforcement and limits

The workflow is a repository convention, not a self-executing runtime.

Agent instructions encourage compliant behavior; they cannot guarantee that every tool or model obeys the convention.

`pnpm --dir .agents flow:check` validates documentation paths, metadata, links, and knowledge snapshot reproducibility. `architecture:check` enforces React monorepo boundaries. `pnpm --dir .agents eval:test` covers delegation policy scenarios (`D01`–`D18`) and harness gates. These checks do not verify human approval, product outcomes, skill invocation, or live subagent execution.

Humans and reviewers remain responsible for approving consequential decisions and evaluating the quality of the work.
