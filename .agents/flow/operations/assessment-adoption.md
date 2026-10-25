# Assessment adoption handoff

Use this page when generating a **separate** product repository for a timed assessment. Flow Starter itself stays product-neutral; do not copy this file into long-lived products unless you are running that exercise.

## Generate a clean repository

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/gaboesquivel/flow-starter/main/.agents/tooling/setup/install.sh)"
```

The installer removes evaluator-only assessment fixtures and this handoff from the generated tree.

## First session in the assessment repository

1. Open the **new** repository (not Flow Starter).
2. Paste the employer's brief as the first human prompt.
3. Ask the implementing agent to create root `CLAUDE.md` with instructions to append every subsequent prompt to `prompts.txt` using an ISO 8601 timestamp and a short summary of work performed. Do not log secrets, tokens, or credentials.
4. The agent must actually append to `prompts.txt` when it acts; it must not claim logging happened if it did not write the file.

## Cursor and `CLAUDE.md`

Cursor may load `CLAUDE.md` as a project rule when the file exists. If a later session ignores it, add a minimal `.cursor/rules` entry in the assessment repository that tells agents to follow `CLAUDE.md`. Do not rewrite the employer's requested `CLAUDE.md` text to match Factory wording.

## Factory vs product

- Methodology, skills, evaluation, and checks live under `.agents/`.
- Product vision, design, and ADRs live at the repository root (`PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`, `docs/`).
- Build the assessment only in `apps/web` and shared `packages/*`.
