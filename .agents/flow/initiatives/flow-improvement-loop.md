Date: 2026-10-24

# Initiative — Flow improvement loop

**Status:** In progress

## Outcome

Run a manually triggered evidence loop for Flow workflow, skill routing, delegation, and evaluations: freeze baseline → test → diagnose → propose remediation → human review → implement approved changes → compare → accept or revert. Evaluations produce evidence and a proposal; they do not self-modify workflow or skills.

## Related work

Harness implementation and scenario cards: [flow-evaluation-suite.md](flow-evaluation-suite.md).

Dogfooding self-improvement (observe → cluster → experiment → L1 promote; L2 inactive): [flow-self-improvement.md](flow-self-improvement.md), [ADR 0013](../decisions/adr/0013-flow-improvement-autonomy.md) (**Proposed**).

## Loop

1. **Freeze** — Pin commit, scenario versions, rubric, `skills-lock.json` hash, harness protocol, model, arm, configuration. Historical run `20261024-flow-v0.1-1256e532` stays immutable.
2. **Test** — Deterministic harness checks first; live agent runs only with explicit run authorization.
3. **Diagnose** — Separate shared safety/outcome criteria from Flow conformance. Missing telemetry is `missing`, not zero.
4. **Propose** — `__dev/flow-evals/<runId>/remediation-proposal.md` with stable finding ids (see format below).
5. **Review** — Gabo and reviewing assistant challenge evidence; approve, reject, or narrow a bounded finding batch.
6. **Implement** — Only named finding ids after explicit remediation authorization.
7. **Compare** — Candidate vs frozen baseline; remediation mode allows different `sourceSha` when rubric/model/arm/protocol match.
8. **Recommend** — Accept, revise, or revert; no automatic merge or workflow self-modification.

### Authorization (distinct, no magic phrases)

| Action | What authorizes it |
| --- | --- |
| Record this initiative | Plan acceptance / Build for initiative doc |
| Live eval run | Message naming pilot, scenario ids, arm, model, session cap |
| Remediation batch | Message naming batch id and finding ids |
| Commit / push / ship | Existing Flow rules; not implied by eval or remediation approval. Remediation approval does not authorize implementation, local integration, or push. After a remediation batch is approved, routine scoped execution and integration into local `main` follow normal **Build** rules without repeated approval. |

## Evaluation layers

| Layer           | Examples                                                |
| --------------- | ------------------------------------------------------- |
| Deterministic   | `classifyDelegation`, gates, grader, compare, redaction |
| Scripted        | Fixture diffs, stakeholder scripts, arm mutations       |
| Live agent      | Cursor CLI `stream-json`; requires `agent login`        |
| Product outcome | Acceptance external to Flow stage labels                |
| Browser         | Only when scenario requires UI verification             |

## Pilot matrix (first live batch)

Stress-test retrospective (autonomous Feature Intelligence build, not a formal eval): [flow-evaluation-suite.md § 2026-10-24](flow-evaluation-suite.md#2026-10-24-autonomous-stress-test-feature-intelligence-on-appsweb).

After WP1–WP2 and explicit run authorization. Cap: **16** sessions. Model default: `composer-2.5`. **2** repetitions per cell via `--repetition 2`.

| Scenario | Arms          | Reps | Shared outcome focus                    |
| -------- | ------------- | ---: | --------------------------------------- |
| S13      | flow, control |    2 | Sort fix + passing test command         |
| S16      | flow, control |    2 | Scoped implement without extra approval |
| S09      | flow, control |    2 | No DB engine swap; conflict surfaced    |
| S01      | flow          |    2 | No product code; explore or stop        |
| S17      | flow          |    2 | Plan only; no product diff              |

Held-out (not in default pilot list): scope expansion, overlapping writes, worker failure, conflicting researchers, fresh-session resume, obsolete skill, green tests / unclear value, correct abandonment.

## Remediation finding format

Each finding: `F-<area>-<nnn>`, severity, confidence, evidence refs (with origin), expected vs observed, reproduction status, likely cause (workflow | skill | implementation | harness | environment | model), proposed action, exact file/rule changes, benefit, regression risk, regression test/scenario, acceptance criteria, dependencies, rollback.

## Progress

- [x] Initiative recorded (this document)
- [x] WP1 — Harness integrity (`@repo/flow-eval`): delegation gates, compare `--remediation`, criteria in reports, S07 handoff fix, user-event redaction, `skillsLockHash`
- [x] WP2 — S16/S17 public cards and oracles, `--repetition`, `pilot-loop`, blind-review loader, catalog stubs under `__dev/flow-evals/catalog/`
- [x] Pilot — Dry-run `pilot-loop-1792879374448` (flow + control, 2 reps). Official run blocked: `agent login` / `CURSOR_API_KEY` (see `__dev/flow-evals/cli-auth-blocker.json` and `pilot-loop-1792879424491/remediation-proposal.md`)
- [x] WP3 — Harness remediation merged in WP1; doc alignment: [delegation.md](../operations/delegation.md) conflicting-research row. **Recommendation:** accept harness baseline at current HEAD for deterministic layer; **revise** live pilot after auth; do not edit `flow.md` for S16 authorization until official S16 evidence exists

## Comparison (dry-run pilot)

```bash
pnpm --filter @repo/flow-eval eval compare \
  --baseline pilot-loop-1792879374448-control \
  --current pilot-loop-1792879374448-flow \
  --remediation
```

Dry-run transcripts are not agent compliance evidence. Gate comparison is only meaningful after official runs with complete stream-json telemetry.

## Validation

```bash
pnpm flow-eval:check
pnpm --filter @repo/flow-eval eval preserve
```

Official pilot additionally requires `agent login` or `CURSOR_API_KEY`.

## Findings (static, pre-pilot)

| Id | Summary | Status |
| --- | --- | --- |
| F-deleg-001 | `applyPolicy` could clear ADR/security/auth gates | Addressed in WP1 (oracle) |
| F-deleg-002 | Adaptive overhead solos only in narrow D14 shape | Addressed in WP1 |
| F-deleg-003 | `workerCount` vs `roles` mismatch | Addressed in WP1 |
| F-deleg-004 | Plan `waveGraph` labeled parallel-implementation | Addressed in WP1 |
| F-harness-001 | Compare aborted on `sourceSha` mismatch | Addressed in WP1 |
| F-harness-002 | Single quality %; `docs/plans/` artifact penalty | Addressed in WP1 |
| F-harness-003 | Duplicate S07 handoff card | Addressed in WP1 |

Live hypotheses (e.g. extra approval after clear “implement this”) remain open until S16 pilot evidence.

## Rejected proposals

- Scheduled eval cron, dashboard, orchestration platform, new doc hierarchy
- Grading control on Flow stage labels as shared outcome
- Single opaque quality score as ship decision
