Date: 2026-10-24

# Initiative — Flow human guide

**Status:** In progress

## Outcome

Publish a concise human-facing guide under `docs/workflow/` so solo founders and small technical teams can understand why Flow exists, how to use it with agents, where context lives, and how Flow is evaluated—without duplicating the operational contract in [flow.md](../workflow/flow.md) or adding a second documentation hierarchy.

## Scope

- Rewrite [docs/workflow/readme.md](../workflow/readme.md) as the entry (~400 words).
- Add five sibling pages: `working-with-flow.md`, `principles.md`, `influences-and-alternatives.md`, `project-context.md`, `learning-and-improvement.md` (~2,500 words total across six pages).
- Add curated historical research [docs/research/20261024-flow-methodology-influences.md](../research/20261024-flow-methodology-influences.md).
- One clarifying sentence in `flow.md` on human-only sibling pages; regenerate Flow Agent knowledge snapshot after `readme.md` changes.
- Sibling pages stay **out** of the ten-file agent knowledge bundle.

Out of scope: approval policy changes, new `flow` methodology skill, `docs/flow-docs/`, eval harness edits, commits to unrelated dirty files.

## Evidence classes (for authors)

| Class | Use in guide |
| --- | --- |
| Implemented behavior | Manifest, `flow:check`, bundle, `flow-eval`, no `flow` skill |
| Current policy | `flow.md`, linked `docs/agents/*` |
| Accepted historical direction | Solo/small-team audience, proportionate process, selective skills (historical flow-skills repo, commit `94d43fd`) |
| Historical proposal or research | Competitive ADOPT/REJECT rows, OMTM, validation board, Ship→Explore as product loop |
| Needs external verification | Competitor capabilities unless reverified |

## Progress

- [x] Plan accepted; initiative recorded
- [x] Six workflow pages drafted to word budget
- [x] Research note with public citations only
- [x] `flow.md` ownership sentence and snapshot regeneration
- [x] `pnpm flow:check` and `pnpm flow:test` pass

## Validation

```bash
pnpm flow:check
pnpm flow:test
wc -w docs/workflow/readme.md docs/workflow/working-with-flow.md docs/workflow/principles.md docs/workflow/influences-and-alternatives.md docs/workflow/project-context.md docs/workflow/learning-and-improvement.md
```

Grep new pages for private paths, `filecite`, overclaims (`proven`, `guaranteed`), and a standalone `flow` skill described as shipped.

## Acceptance checklist

A new reader, without agent instructions, can answer:

1. Why does Flow exist?
2. Is it suitable for my work?
3. How do I begin?
4. When is discovery useful, and when can work proceed directly?
5. Why these skills and influences?
6. Where do intent and decisions live?
7. How do we judge whether the work—and Flow itself—helped?

Additional: `flow.md` wins on conflict; examples match current approval contract; improvement loop not described as automatic self-modification.

## Related documents

- Operational authority: [flow.md](../workflow/flow.md)
- Evaluation harness: [flow-evaluation-suite.md](flow-evaluation-suite.md)
- Improvement loop (operating process): [flow-improvement-loop.md](flow-improvement-loop.md)
