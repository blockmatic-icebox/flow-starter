# Corrective pass — 2026-10-25

**Starting revision:** `70d4708fe2cde711761b227c62a3eccb1fb5d0a1`  
**Ending revision:** `6aa075d` (`70d4708` → corrective pass on `main`)

## Defects fixed

| ID | Fix |
| --- | --- |
| D1 | `prompt-log.test.mjs` allows nonempty `.agents/flow/prompts.txt` |
| D2 | Factory CI runs `pnpm --dir .agents test` after `check` |
| D3 | `eval:test` includes `eval/src/*.test.ts` and nested globs |
| D4 | Trial metadata in `trials/.../trial-meta.json`; no `.eval-meta.json` in worktree |
| D5 | Docs/commands aligned to `pnpm --dir .agents` and root `tooling/` |
| D6 | This record + `factory-simplification.md` evidence tiers (below) |

## Simplification metrics

| Metric | Before (`70d4708`) | After (`aa26c68`+) |
| --- | --- | --- |
| `cli.ts` lines | 840 | 840 |
| `flow.md` lines | 468 | 468 |
| Product-owned `tooling/` | no | yes (security, hooks, gitleaks) |
| `knip.json` Factory entries | yes | moved to `knip.factory.json` |
| Factory `pnpm test` (local) | 239 | 240 |

## Retained-subsystem matrix (summary)

| Subsystem | Caller | Responsibility | Tests | Failure mode |
| --- | --- | --- | --- | --- |
| `eval` host-session | `/flow-eval`, `eval prepare/next/record/finalize` | Runner protocol v2 | `host-session.test.ts`, `eval:test` | Incomplete jobs block `finalize` |
| `eval` isolate | `setupWorktree` | Neutral worktree + arm mutations | `isolate.test.ts` | Throws on install/git errors |
| `eval` generation | `eval:experiment`, `eval:self-improve` | Seeded scenarios | `generation/*.test.ts` | CLI exit non-zero |
| `eval` product | `eval:stress`, `eval:readiness` | Deterministic product gates | `product/*.test.ts` | Fixture mismatch |
| `tooling/worktrees` | `pnpm --dir .agents worktrees` | Initiative waves (optional) | `*.test.mjs` | `ok: false` on failed tasks |
| Root `tooling/` | hooks, `ci`, `security:*` | Product quality/security | `tooling/**/*.test.mjs` | Hook exit 1 |
| `flow.md` + operations | `AGENTS.md`, skills | Methodology contract | `flow:test` | `flow:check` exit 1 |

## `/flow-eval` smoke (S01)

| Item | Result |
| --- | --- |
| `eval integrity` | exit 0 |
| `prepare --scenarios S01 --arm flow` | `run-1792945402143`, worktree `ws-9a6d6b092d57` |
| Worktree `.eval-meta.json` | absent |
| `trial-meta.json` | present under `.agents/eval/evidence/flow-evals/...` |
| Turn 1 | Cursor Task subagent (`composer-2.5`); real `DESIGN.md` edit in worktree |
| `eval record` turn 1 | exit 0 |
| `eval finalize` (turn 1 only, prior run) | exit 1 — incomplete session |
| Bounded completion (`complete-s01-smoke.mjs`) | `run-1792945783964`, `finalize` **ok: true**, `officialEligible: false` |
| Official comparative eligibility | **blocked** (ADR 0015) |

## Dogfooding smoke

| Item | Result |
| --- | --- |
| Disposable install | `dogfood-github-dark` under temp dir |
| DESIGN.md | Updated in Explore with Primer dark-dimmed reference (proposed) |
| PRODUCT.md | Scope bullets added (proposed) |
| Commits / app code | None beyond install initial commit |
| Journal | Parent-owned; see `prompts.txt` entry |

## Isolation limitations (remaining)

- Flow arm skills symlink; shared host MCP/skills; fixture copy; inert eval stub package; same-machine worktrees; runner brief still uses stakeholder turns after turn 1.

## Evidence tiers (corrective pass)

| Claim | Tier |
| --- | --- |
| Factory test suite green | Statically tested (`pnpm --dir .agents test` exit 0, 240 tests) |
| Product knip without `.agents` | Manually verified (`product-only-verify` install, rm `.agents`, `pnpm lint:fix`, `pnpm qa` exit 0, `pnpm build` exit 0) |
| Trial meta not in subject tree | Integration tested (`isolate.test.ts` + live prepare) |
| S01 live worker | Manually verified (one turn, real subagent) |
| Full S01 session grade | Manually verified (bounded agent-reported turns; diagnostic not official) |
| Official compare | Blocked |
