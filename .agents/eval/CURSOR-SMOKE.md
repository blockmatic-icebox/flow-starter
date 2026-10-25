# Cursor `/flow-eval` diagnostic smoke (manual)

Run only with explicit user authorization. Diagnostic only—not official flow-vs-control evidence.

1. Invoke `/flow-eval` with `--scenarios S01` (or dry-run first).
2. Confirm the parent session stays open through `finalize`, not only `prepare`.
3. Confirm the subject worktree has no `.agents/eval/RUN.md` or oracle files.
4. Confirm `summary.md` under the run directory matches the parent-session summary.
5. If a job fails, confirm partial `finalize` retains completed trials and records failed job status.

Record observed limitations (isolation, transcript provenance) in the parent chat.
