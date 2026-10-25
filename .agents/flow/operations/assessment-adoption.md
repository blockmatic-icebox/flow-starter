# Assessment adoption handoff

Use this page when generating a **separate** product repository for a timed assessment. Flow Starter itself stays product-neutral; do not copy this file into long-lived products unless you are running that exercise.

## Generate a clean repository

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/gaboesquivel/flow-factory/main/.agents/tooling/setup/install.sh)"
```

The installer removes evaluator-only assessment fixtures and this handoff from the generated tree. It keeps an empty Factory prompt log at `.agents/flow/prompts.txt`.

## First session in the assessment repository

1. Open the **new** repository (not Flow Starter).
2. Paste the employer's brief as the first human prompt.
3. Work through [AGENTS.md](../../../AGENTS.md) and load the Flow skill ([SKILL.md](../../skills/flow/SKILL.md)). The coordinator appends each handled human prompt to `.agents/flow/prompts.txt` per that skill and [journal.md](journal.md).

Many assessments ask for a separate `CLAUDE.md` logger. Flow Starter intentionally does **not** add `CLAUDE.md`. Equivalent logging lives in the shared entrypoint plus the Flow skill only—not a literal match to the requested filename.

4. The coordinator must actually append to `.agents/flow/prompts.txt` when it acts; it must not claim logging happened if it did not write the file.

## History and forks

Forks may retain prior prompt logs in git history. A repository created by the installer starts with an empty Factory log only; it does not replay historical maintenance prompts.

## Factory vs product

- Methodology, skills, evaluation, and checks live under `.agents/`.
- Product vision, design, and ADRs live at the repository root (`PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `docs/`).
- Build the assessment only in `apps/web` and shared `packages/*`.
