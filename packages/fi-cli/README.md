# @repo/fi-cli

Official workspace CLI for Feature Intelligence agent discovery (assessment demo).

```bash
pnpm --filter @repo/fi-cli exec fi
AGENTIC_CHECK_URL=meta-cto-two.vercel.app pnpm --filter @repo/fi-cli exec fi --openapi
AGENTIC_CHECK_URL=meta-cto-two.vercel.app pnpm --filter @repo/fi-cli mcp-smoke
```

`--mcp-smoke` runs Streamable HTTP `initialize` and `tools/list` against `https://<host>/api/mcp` with the required `Accept: application/json, text/event-stream` header.

Publish to npm under your org when productizing; this package documents the CLI surface for Is Agentic audits.
