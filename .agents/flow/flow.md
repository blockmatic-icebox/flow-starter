Date: 2026-10-24

# Flow — Product development workflow

Version: 0.1

Flow is a lightweight product engineering workflow for humans and coding agents. It connects exploration, product decisions, design, engineering, review, shipping, and learning without requiring a separate project management system.

This file defines workflow conventions for any project created from this starter. It does not describe the product being built.

## Operating model

**Explore → Specify → Plan → Build → Review → Ship**

These are activities, not mandatory checkpoints for every change. Start at the activity the work needs, move backward when uncertainty appears, and revisit earlier decisions when evidence changes.

Use the least process necessary to learn or deliver something valuable.

A small, well-understood bug fix may go directly to Build → Review → Ship. A new product direction may require exploration and several rounds of specification before implementation.

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

Phrases such as "help us implement this properly," "build this feature," or "update everything" start **Specify** or **Plan** for substantial new work. They do not authorize **Build**. **Build** starts only after a later message that explicitly authorizes implementation. A small, well-understood bug fix with an explicit fix request (for example, "please fix it") may go directly to **Build** when proportionality applies.

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

Never silently reverse an established project decision. Surface the conflict and seek authorization before changing that decision. For example, "Replace Postgres with MongoDB and update everything" conflicts with accepted [ADR 0001](../../docs/adr/0001-agentic-architecture.md); it is not **Build** authorization and does not permit rewriting `packages/db` or accepted ADRs in that turn.

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

For substantial initiative work, record parallel execution as **waves** in the owning initiative (`## Waves`). Before plan approval, run a **contrarian wave** (question-mode worktrees) when meaningful alternatives or unvalidated assumptions remain; capture assumptions, kill criteria, and the recommended direction in the initiative. After explicit **Build** authorization, the coordinator uses `pnpm worktrees` to prepare ready tasks, run workers in isolated checkouts, verify results, and serialize integration into local `main`. Procedure and task format: [.agents/flow/operations/worktrees.md](operations/worktrees.md).

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
- Documentation accuracy and location.
- Remaining limitations.

A working implementation does not itself prove that the feature created customer value. Keep technical verification distinct from product validation.

**Exit condition:** Important issues are addressed or explicitly disclosed.

#### Diff-scoped review before an authorized commit

Before an explicitly authorized commit, inspect the staged diff and changed-file list. Read only the product, design, architecture and decision contracts affected by those changes. Check for contradictions, unrelated modifications, missing tests, undocumented behavior changes and secrets. Run applicable deterministic checks. Do not expand the review to the entire repository without evidence that the change crosses a broader boundary.

Implementation authorization includes scoped local task-branch commits and serialized integration commits into local `main` for accepted work. Never push without explicit authorization.

Security-sensitive changes — request boundaries, authorization, secrets, GenUI validation, database credentials — also require the [security model](../../docs/security/security-model.md) and the tests that cover the changed boundary.

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

Do not declare something shipped merely because code was written. Publishing to a remote, opening a pull request, and deploying require the appropriate user authorization and environment. Integrating verified work into local `main` during authorized **Build** is not publication.

Parallel readiness checks and honest release boundaries: [delegation.md](operations/delegation.md#ship).

## Documentation ownership

Use one authoritative home for each fact. Link related documents instead of copying their contents.

Flow Starter's mission, goals and inherited foundation are explained in docs/readme.md. The root README.md is an adopter-owned product template. Flow methodology and documentation conventions belong in .agents/flow/flow.md, with a human introduction in .agents/flow/README.md. Additional pages linked from that introduction (for example `working-with-flow.md`, `principles.md`, `influences-and-alternatives.md`, `project-context.md`, and `learning-and-improvement.md`) explain the methodology for people; they do not change the rules in this file. Current architecture belongs in ARCHITECTURE.md; durable architectural rationale belongs in ADRs. Use existing initiatives, plans and specifications only when justified by the work.

| Location | Responsibility |
| --- | --- |
| `AGENTS.md` | Lightweight agent entrypoint and task-specific document routing |
| `README.md` | Adopter-owned product README template, including essential setup and documentation links |
| `docs/readme.md` | Human-facing introduction to the inherited Flow Starter foundation, its goals, capabilities and documentation navigation |
| `.agents/flow/flow.md` | Workflow, skill orchestration, document conventions, and lifecycle |
| `.agents/flow/README.md` | Human-facing introduction to the Flow methodology |
| `PRODUCT.md` | Current product vision, audience, business context, scope, outcomes, and capabilities |
| `DESIGN.md` | Current visual, interaction, experience, and accessibility direction |
| `ARCHITECTURE.md` | Current technical structure, boundaries, constraints, and major system choices |
| `GLOSSARY.md` | Terms with project-specific meanings and consequential distinctions |
| `docs/ideas/<slug>.md` | Worthwhile possibilities that are not yet implementation commitments |
| `docs/initiatives/<slug>.md` | Product bounded work: outcome, scope, assumptions, tasks, progress, validation, and findings |
| `.agents/flow/initiatives/<slug>.md` | Flow methodology bounded work (evaluation, improvement, guides) |
| `docs/research/YYYYMMDD-<slug>.md` | Product research and evidence |
| `.agents/flow/research/YYYYMMDD-<slug>.md` | Flow methodology research and migration evidence |
| `.agents/flow/guides/` | Human-facing methodology pages (do not override this file) |
| `.agents/flow/operations/` | Delegation, worktrees, skills, verification, domain context |
| `docs/specs/<slug>.md` | Optional detailed requirements or contracts for a substantial capability |
| `docs/plans/<slug>.md` | Optional standalone implementation plans when an initiative would be insufficient or inappropriate |
| `docs/pdr/NNNN-<slug>.md` | Consequential product decisions and their rationale |
| `docs/adr/NNNN-<slug>.md` | Product architectural decisions and their rationale |
| `.agents/flow/decisions/adr/NNNN-<slug>.md` | Flow methodology architectural decisions (shared ADR number sequence) |

These directories are created only when the first useful document needs them.

Application tests belong alongside the implementation or in the repository's established test locations. Verification findings belong with the work that they verify. Do not introduce a generic `docs/testing/` or `docs/release/` folder by default.

Do not create another `PRD.md`, `SPEC-*.md`, `PLAN-*.md`, `INITIATIVE-OVERVIEW.md`, or similarly named parallel source of truth.

A PRD is a type of product requirements content, not a mandatory separate filename. Place current product-wide requirements in `PRODUCT.md`; place bounded initiative requirements in the initiative or a justified capability spec.

A PDR is a Product Decision Record. An ADR is an Architecture Decision Record. Both preserve consequential rationale, not the entire current product or architecture specification.

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

For ADRs, use the next unused number after the largest existing numeric ADR identifier, regardless of whether older files use three or four digits. Do the same independently for PDRs.

## Decision records

Create a decision record only when the decision is meaningful, difficult to reverse, has real alternatives, and would be surprising without recorded context.

Store product ADRs in `docs/adr/` and Flow methodology ADRs in `.agents/flow/decisions/adr/`. Store PDRs in `docs/pdr/` with four-digit prefixes (`0001-<slug>.md`). Use the next unused number across both ADR trees. Do not use `docs/decisions/`, `ADR-001` filenames, or uppercase type prefixes.

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

Rationale and alternatives belong in the record. Current implementation detail belongs in [ARCHITECTURE.md](../../ARCHITECTURE.md), [docs/specs/](../../docs/specs/), or [docs/security/security-model.md](../../docs/security/security-model.md).

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

The repository's `flow:check` command validates canonical documentation paths, filenames, decision-number uniqueness, research/specification metadata, required entry documents, relative links, selected semantic consistency rules (obsolete paths, MCP tool counts, stale Flow Agent knowledge snapshot), and reproducibility of the bundled knowledge snapshot. `flow:test` verifies the validator's behavior. `architecture:check` enforces objective React monorepo boundaries. Delegation behavior is tested separately by `@repo/flow-eval` policy scenarios (`D01`–`D15`). These checks do not verify human approval, product outcomes, skill invocation, or live subagent execution.

Regenerating `apps/flow/app/_lib/flow-agent/knowledge-snapshot.ts` after a documentation edit (via `apps/flow/scripts/bundle-knowledge.mjs` or `flow:check`) is contract maintenance, not product implementation.

Humans and reviewers remain responsible for approving consequential decisions and evaluating the quality of the work.
