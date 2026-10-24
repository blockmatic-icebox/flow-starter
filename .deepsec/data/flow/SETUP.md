# Agent setup for Flow

INFO.md is filled. Do not re-run the placeholder pass.

## Next (local, not this PR)

From the monorepo root:

```bash
pnpm deepsec scan
pnpm deepsec process -- --diff origin/main
```

`scan` is regex-only (no AI). `process` needs `AI_GATEWAY_API_KEY` in `.deepsec/.env.local` or the environment. Default agent is Grok 4.6 (`pi`) from `deepsec.config.ts`. Override on the command, for example `--agent codex --model gpt-5.6-sol`.

`--project-id` is auto-resolved while there is only one project.

Custom matchers: wait for a revalidated true positive. See `node_modules/deepsec/dist/docs/writing-matchers.md`.
