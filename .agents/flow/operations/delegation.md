# Adaptive delegation

The **Flow Coordinator** is the main coding-agent session. It may delegate bounded work to workers when that reduces elapsed time without sacrificing quality, coherence, or human control.

**Flow** chooses the lifecycle activity. **Skills** provide methods ([skills.md](skills.md)). **Subagents** provide isolated execution capacity. Loading a skill does not require a dedicated worker; delegating work does not require loading every skill on the task.

Stages, approvals, and document ownership: [flow.md](../flow.md). Parallel git worktrees, waves, and briefs: [worktrees.md](worktrees.md).

## Execution modes

| Mode | When | Examples |
| --- | --- | --- |
| **Solo** | Small, well-understood work; orchestration overhead would exceed benefit | Typo, single-component tweak, clear bug fix |
| **Parallel investigation** | Independent open questions | Discovery, competitors, feasibility, architecture options, security analysis, codebase exploration |
| **Parallel implementation** | Approved Build with separable ownership | UI and server against agreed contracts; isolated packages; independent routes |
| **Independent verification** | Meaningful change needs judgment separate from implementation | Acceptance, architecture, security, a11y/browser, requirements compliance |

Default to considering delegation for substantial work. Use fewer workers when parallelism has little value. There is no fixed global agent count.

**Independence check:** Split work only when acceptance criteria, `writes` paths, and execution order are separable and parallel overhead is likely smaller than the benefit. Otherwise stay solo. Work kind (new product, existing product, Flow improvement) does not by itself require parallel workers.

## Decision heuristic

Weigh qualitatively (no scores or duration estimates):

1. Task complexity and scope
2. Independence of subtasks
3. Context isolation benefit
4. Opportunity to reduce elapsed time
5. Risk of conflicting edits
6. Integration complexity
7. Coordination and token overhead
8. Required human authorization
9. Whether subagents and worktrees are actually available

**Stop and escalate to a human** when a request conflicts with an accepted ADR/PDR or root contract, when consequential product direction is unresolved, or when **Build** is requested without explicit implementation authorization.

## Worker roles

Map roles onto [worktree task fields](worktrees.md#fields); do not add new `mode` values.

| Role | `mode` | `flow_stage` | Writes | Notes |
| --- | --- | --- | --- | --- |
| **Researcher** | `question` | Explore, Specify, or Plan | `[]` | Read-only; evidence and recommendations; does not approve product direction |
| **Builder** | `build` | Build | Bounded paths | Requires `build_authorized: yes`; owns only listed `writes` |
| **Verifier** | `question` | Review | `[]` | Read-only; checks against acceptance criteria; does not expand scope |

Optional Cursor adapters (not required for Flow): `.cursor/agents/researcher.md`, `builder.md`, `verifier.md`.

## By stage

### Explore

Delegate parallel **researchers** for user/problem research, alternatives, feasibility, and assumption challenges. Synthesize one coherent discussion in the coordinator. Researchers return evidence with sources, uncertainties, alternatives, and limitations. Do not edit canonical product documents before Specify approval.

### Specify

Delegate **researchers** on different dimensions (journeys, edge cases, acceptance, security/privacy, NFRs) against the same accepted intent. The coordinator produces one consistent contract. Do not let multiple workers edit `PRODUCT.md` or the same initiative independently.

### Plan

Delegate parallel investigation of architecture, alternatives, data/API boundaries, dependencies, and verification strategy. Synthesize a **dependency-aware** plan in the initiative: smallest vertical slice, independent work packages, prerequisites, file ownership, shared contracts, execution order, parallelizable groups, integration owner, acceptance, verification. Use `## Waves` for sustained parallel work ([worktrees.md](worktrees.md)).

Example wave graph (B and C after A; D after B and C; E after D):

```markdown
## Waves

### Wave contract

#### task: contract

- mode: question
- flow_stage: Plan
- depends_on: []
- writes: []
- reads: [ARCHITECTURE.md]
- skills: [planning-and-task-breakdown]

### Wave implement

#### task: server

- depends_on: [contract] ...

#### task: ui

- depends_on: [contract] ...

### Wave integrate

#### task: integrate

- depends_on: [server, ui] ...

### Wave verify

#### task: verify

- mode: question
- flow_stage: Review
- depends_on: [integrate]
- writes: []
```

### Build

After authorization, the coordinator automatically runs **dependency-aware scheduling**—not everything at once. Launch ready independent tasks in isolated worktrees up to host capacity; refill as tasks integrate into local `main`. Wave 1: shared contracts and interfaces. Wave 2: parallel **builders** with non-overlapping `writes`. Wave 3: coordinator verifies, serializes integration, and resolves mismatches; run deterministic checks. Wave 4: **verifiers** where warranted.

Use `pnpm --dir .agents worktrees prepare` / `pnpm --dir .agents worktrees run` (or `up` to prepare a wave). Do not parallel-write a shared checkout. Multi-file slices use `incremental-implementation` (local task commits under implementation authorization).

### Review

Run deterministic tests and checks before expensive model review. Delegate **verifiers** proportionately (functional, security, architecture, UI/a11y). Do not launch every reviewer on every change. Deduplicate findings; prioritize by severity and acceptance impact.

### Ship

Parallelize independent readiness checks when useful (tests, build, docs accuracy, release/security ops). Report what is complete, verified, which acceptance criteria passed, limitations, and what still needs human authorization. Local checks are not a deployment or release.

## Task packet (prompt-level)

For each significant delegation, include in the worker prompt (no persisted YAML for ordinary work):

- Task id and current Flow stage
- Objective and expected outcome
- Relevant accepted decisions
- Minimal context paths (`reads`)
- Dependencies on other tasks
- Permitted operations (read-only vs bounded `writes`)
- Ownership boundaries
- Expected deliverable
- Acceptance criteria and verification requirements
- Requested reporting format

Worktree briefs generated by `pnpm --dir .agents worktrees up` follow the same contract; see [Agent brief](worktrees.md#agent-brief).

## Worker report

Workers return structured facts to the coordinator only—not a user-facing **Task report** and never an append to `.agents/flow/prompts.txt`. Keep returns concise; no full transcripts or source dumps unless the coordinator needs them for a decision.

Use the **Worker result contract** below. Detailed dumps only when the coordinator needs them for a decision. Do not pass full parent transcripts to workers.

## Failure handling

| Situation | Behavior |
| --- | --- |
| Subagent tools unavailable | Sequential execution in isolated worktrees when possible; record limitation; do not claim parallel workers ran |
| Incomplete research | State gaps; do not invent evidence |
| Worker failure | Retry once if cheap; otherwise sequential fallback |
| Conflicting findings | Coordinator reconciles solo (human gate); escalate product conflicts to human; do not spawn another parallel research wave |
| Conflicting edits | Stop parallel writers; parent integrates or serializes |
| Expired assumptions | Revisit stage; do not Build on stale decisions |
| Unclear authorization | Stop before Build; ask human |

## Worker result contract

Every delegated task returns to the coordinator (not the user) with:

- **Worker / task identifier** and assigned scope (`reads` / `writes`)
- **Execution status** — `completed`, `failed`, `blocked`, or `partial`
- **Outcome** — meaningful findings or what was implemented
- **Changed paths** — repository-relative paths with change type (`created`, `updated`, `removed`); coordinator verifies integration—worker claims are not sufficient alone
- **Documentation** — paths created or modified (product contracts, `docs/*`, Factory `.agents/flow/*`), proposed vs integrated changes, ADR/PDR paths with status when applicable, research or initiative paths
- **Code** — concise summary by capability or module
- **Verification** — commands actually run with exit codes and outcomes; never claim tests not run
- **Git** — commit SHA and subject on the worker branch when created, or `none`
- **Skills loaded** — only skills whose `SKILL.md` was read during this worker task
- **Blockers and unresolved questions**
- **Recommended next action** to the coordinator

Research-only and verifier workers stay read-only. Multiple workers must not independently edit the same canonical file.

## Coordinator closeout

After every repository task (not only substantial work):

1. Collect worker returns; deduplicate findings; reconcile against the integrated checkout (distinguish disposable worktree changes from merged work).
2. Distinguish worker claims from coordinator-verified results.
3. Optionally append **one** Q/A prompt log block when logging is enabled or the brief requires it ([prompt-log.md](prompt-log.md), [journal.md](journal.md#prompt-log-qa-format)); never commit prompt logs.
4. Produce **one** user-facing **Task report** per [journal.md](journal.md#task-report-user-visible), then the **Skills loaded** footer ([skills.md](skills.md)).

Workers must never write the shared prompt journal or publish a separate final report to the user.

## Evaluation classes

Distinguish:

1. **Static policy tests** — `classifyDelegation` in `@repo/flow-eval` (scenarios `D01`–`D15`)
2. **Scripted orchestration tests** — policy comparison without live agents
3. **Host-session methodology runs** — `/flow-eval` with `eval prepare` / `next` / `record` / `finalize` (host subagents; no pinned model)
4. **Browser verification** — [verification.md](verification.md)

A passing `pnpm flow:check` does not prove delegation behavior. Record metrics (wall clock, tokens, workers) only when observed; use `missing` when the environment does not expose them.
