# Cursor `/flow-eval` diagnostic smoke (manual)

Run only with explicit user authorization. Diagnostic only—not official flow-vs-control evidence.

1. Invoke `/flow-eval` with `--scenarios S01` (or dry-run first).
2. `eval prepare --host cursor`; after each subject turn: `record` then `observe` (runner observed commands).
3. Confirm the parent session stays open through `finalize`, not only `prepare`.
4. Confirm the subject worktree has no `.agents/eval/RUN.md` or oracle files.
5. `eval finalize --accept-diagnostic --model-id <id>` when not claiming official eligibility.
6. Confirm `summary.md` under the run directory matches the parent-session summary.

Record observed limitations (isolation, transcript provenance) in the parent chat.
