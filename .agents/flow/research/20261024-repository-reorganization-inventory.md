# Repository reorganization inventory

**Research date:** 2026-10-24  
**Last reviewed:** 2026-10-24  
**Status:** Current

Baseline: `038cce9` on `main` (clean working tree at start).

## Move

| From | To | Notes |
| --- | --- | --- |
| `packages/flow-eval/` | `.agents/eval/` | Factory evaluation engine |
| `GLOSSARY.md` | `.agents/flow/glossary.md` | Factory terminology |
| `scripts/worktrees.mjs`, `scripts/worktrees/` | `.agents/tooling/worktrees/` | Orchestration |
| `scripts/check-flow-docs.*` | `.agents/tooling/checks/` | Factory doc governance |
| `scripts/check-react-architecture.*` | `.agents/tooling/checks/` | Product React ADR enforcement |
| `scripts/check-staged.*` | `.agents/tooling/checks/` | Pre-commit routing |
| `scripts/benchmark-clean-checkout.mjs` | `.agents/tooling/benchmarks/` | Eval support |
| `scripts/block-secret-files.*`, `scan-*`, `security-check.mjs` | `.agents/tooling/security/` | Factory security |
| `scripts/setup-*.mjs`, `update-deps.mjs`, `install.sh` | `.agents/tooling/setup/` | Bootstrap |
| `tests/security/` | `.agents/tooling/security/tests/` | Security harness |
| `.cursor/agents/*.md` | `.agents/agents/` | Canonical worker defs (adapters remain in `.cursor`) |

## Delete

| Path         | Reason                                                |
| ------------ | ----------------------------------------------------- |
| `apps/flow/` | Web-only product; demo app not in target architecture |

## Keep at root (exceptions)

| Path | Reason |
| --- | --- |
| `AGENTS.md`, `package.json`, `pnpm-workspace.yaml`, lockfile, `turbo.json` | Tooling entry points |
| `.github/`, `.cursor/` | CI and agent discovery |
| `.deepsec/` | DeepSec project root (verify after move) |
| `skills-lock.json` | Skills CLI manifest |
| `packages/db/scripts/` (new) | Product DB helpers; root `pnpm db:*` delegates here |

## Path string updates

- `packages/flow-eval` → `.agents/eval`
- `scripts/worktrees` → `.agents/tooling/worktrees`
- `GLOSSARY.md` → `.agents/flow/glossary.md`
- Remove all `apps/flow` / `flow-app` executable references
