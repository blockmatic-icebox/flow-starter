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

## Authority and responsibilities

- **Human intent:** Explicit requests, approvals, and accepted project decisions determine what work is authorized.
- **Project contracts:** `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, and `GLOSSARY.md` describe current accepted direction.
- **Flow:** This file determines the workflow, ownership of information, document locations, and naming conventions.
- **Skills:** Installed skills provide specialized methods for exploration, validation, requirements, planning, implementation, and review.
- **Code and tests:** Establish observed implementation behavior, but do not automatically override accepted product intent.

If a skill prescribes an output path or naming pattern that conflicts with Flow, retain the skill's useful method and write its output to Flow's canonical location.

If a skill's mandatory workflow cannot be performed in the available environment, explain the limitation and use an applicable installed alternative. Never claim that a skill was executed when it was not.

Never silently reverse an established project decision. Surface the conflict and seek authorization before changing that decision.

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

For a small task, a concise plan in the conversation is sufficient. For sustained initiative work, keep the plan and task progress in its initiative document. A standalone plan is exceptional, not the default.

**Exit condition:** The first implementation slice is unambiguous and verifiable.

### 4. Build

**Purpose:** Implement the smallest useful change consistent with accepted decisions.

- Follow the existing stack and repository architecture.
- Prefer existing abstractions and established patterns.
- Use applicable development and testing skills.
- Implement or update tests at the appropriate boundary.
- Keep changes scoped to the agreed outcome.
- Update the owning documentation when behavior or accepted direction changes.
- Do not modify unrelated files for incidental cleanup.

**Exit condition:** The agreed slice works locally and has relevant verification evidence.

### 5. Review

**Purpose:** Verify correctness, coherence, and alignment with intent.

Review:

- Acceptance criteria and edge cases.
- Tests and relevant quality checks.
- Security and permission boundaries where applicable.
- Accessibility, interaction, and responsive behavior where applicable.
- Compatibility with established architectural decisions.
- Unnecessary complexity or duplicate concepts.
- Documentation accuracy and location.
- Remaining limitations.

A working implementation does not itself prove that the feature created customer value. Keep technical verification distinct from product validation.

**Exit condition:** Important issues are addressed or explicitly disclosed.

#### Diff-scoped review before an authorized commit

Before an explicitly authorized commit, inspect the staged diff and changed-file list. Read only the product, design, architecture and decision contracts affected by those changes. Check for contradictions, unrelated modifications, missing tests, undocumented behavior changes and secrets. Run applicable deterministic checks. Do not expand the review to the entire repository without evidence that the change crosses a broader boundary. Never commit or push without explicit authorization.

Security-sensitive changes — request boundaries, authorization, secrets, GenUI validation, database credentials — also require the [security model](../security/security-model.md) and the tests that cover the changed boundary.

Automatic checks prove deterministic behavior. They do not replace judgment about product intent, threat model, or whether a change belongs in the commit.

Do not execute a model to validate behavior that a deterministic test, compiler, or schema can decide.

### 6. Ship

**Purpose:** Deliver the agreed change and preserve enough context for continued work.

- Run the applicable repository checks.
- Report what changed.
- Report the actual tests and outcomes.
- State any unverified behavior and follow-up work.
- Update initiative status and findings if an initiative exists.
- Update accepted project contracts when decisions or intended behavior changed.
- Capture product outcome evidence when available; otherwise state what remains unknown.

Do not declare something shipped merely because code was written. Publishing, merging, or deploying requires the appropriate user authorization and environment.

## Documentation ownership

Use one authoritative home for each fact. Link related documents instead of copying their contents.

Flow Starter's mission, goals and inherited foundation are explained in docs/readme.md. The root README.md is an adopter-owned product template. Flow methodology and documentation conventions belong in docs/workflow/flow.md, with a human introduction in docs/workflow/readme.md. Current architecture belongs in ARCHITECTURE.md; durable architectural rationale belongs in ADRs. Use existing initiatives, plans and specifications only when justified by the work.

| Location | Responsibility |
| --- | --- |
| `AGENTS.md` | Lightweight agent entrypoint and task-specific document routing |
| `README.md` | Adopter-owned product README template, including essential setup and documentation links |
| `docs/readme.md` | Human-facing introduction to the inherited Flow Starter foundation, its goals, capabilities and documentation navigation |
| `docs/workflow/flow.md` | Workflow, skill orchestration, document conventions, and lifecycle |
| `docs/workflow/readme.md` | Human-facing introduction to the Flow methodology |
| `PRODUCT.md` | Current product vision, audience, business context, scope, outcomes, and capabilities |
| `DESIGN.md` | Current visual, interaction, experience, and accessibility direction |
| `ARCHITECTURE.md` | Current technical structure, boundaries, constraints, and major system choices |
| `GLOSSARY.md` | Terms with project-specific meanings and consequential distinctions |
| `docs/ideas/<slug>.md` | Worthwhile possibilities that are not yet implementation commitments |
| `docs/initiatives/<slug>.md` | Intentional bounded work: outcome, scope, assumptions, tasks, progress, validation, and findings |
| `docs/research/YYYYMMDD-<slug>.md` | Durable evidence, source assessment, limitations, and research findings |
| `docs/specs/<slug>.md` | Optional detailed requirements or contracts for a substantial capability |
| `docs/plans/<slug>.md` | Optional standalone implementation plans when an initiative would be insufficient or inappropriate |
| `docs/pdr/NNNN-<slug>.md` | Consequential product decisions and their rationale |
| `docs/adr/NNNN-<slug>.md` | Consequential architectural decisions and their rationale |

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

Prefer concise records with:

- Status
- Context
- Decision
- Alternatives considered
- Consequences
- Related documents

Use `Proposed`, `Accepted`, `Superseded`, or `Deprecated` for status as appropriate.

Preserve previous accepted decisions as historical records. If a decision changes, write a superseding record and update the current owning document.

Do not write ADRs or PDRs for routine tasks, obvious code, or ordinary clarification.

## Skill selection

Choose skills based on the user's intent and the work's actual uncertainty. Do not invoke the entire skill set for every task.

| Intent | Preferred skill | Flow destination |
| --- | --- | --- |
| Explore or sharpen a raw idea | `idea-refine` | Conversation or `docs/ideas/<slug>.md` |
| Validate a customer problem | `problem-validation` | Initiative or dated research |
| Design an experiment | `experiment-design` | Relevant initiative |
| Draft product requirements | `prd-writing` | `PRODUCT.md`, initiative, or justified spec |
| Define a substantial feature | `spec-driven-development` | Initiative and optional `docs/specs/<slug>.md` |
| Break down significant work | `planning-and-task-breakdown` | Existing initiative; standalone plan only if justified |
| Implement iteratively | `incremental-implementation` | Code and tests in established project locations |
| Develop tests | `test-driven-development` | Established test locations |
| Review implementation | `code-review-and-quality` | Findings in response or owning initiative |
| Record technical decisions | `documentation-and-adrs` | `docs/adr/NNNN-<slug>.md` |
| Resolve domain terminology | `domain-modeling` | `GLOSSARY.md`, related current documents, optional ADR |
| Create agent instructions | `writing-for-agents` | Relevant agent instruction file |

A skill may support more than one activity. This table is a default routing guide, not a prohibition against other installed skills.

Use an explicitly requested skill if it is installed and applicable. Read its instructions. Apply Flow's document ownership and naming rules to its outputs.

For naturally expressed requests, select the smallest relevant skill set and follow the same conventions without requiring slash commands.

Skill installation or availability does not imply that a skill has been used. Do not invent invocations or hidden execution.

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

The repository's `flow:check` command validates canonical documentation paths, filenames, decision-number uniqueness, research/specification metadata, required entry documents, and relative links under the canonical documents and `docs/`. `flow:test` verifies the validator's behavior. `architecture:check` enforces objective React monorepo boundaries. These checks do not verify semantic correctness, approval, product outcomes, or skill invocation.

Humans and reviewers remain responsible for approving consequential decisions and evaluating the quality of the work.
