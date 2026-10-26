# Research: Feature Intelligence — agentic discoverability verification

**Research date:** 2026-10-26  
**Last reviewed:** 2026-10-26  
**Status:** Current  
**Branch:** `meta-cto`  
**Production alias:** `https://meta-cto-two.vercel.app`  
**Purpose:** Evidence for [agentic discoverability spec](../specs/feature-intelligence-agentic-discoverability.md) acceptance (AD-1–AD-7) and Is Agentic **G-A4**.

## Deployment references

| Deploy | Commit (short) | Notes |
| --- | --- | --- |
| `dpl_BbFJbLjWEG3pZtzSCd9oLhEv5kft` | `ea0b7a0cd` | Markdown negotiation, sitemap, llms origin, `/.well-known/mcp` |
| `dpl_3Hmbro2oVsyt3CpvVff7gdETKstt` | `b9b6973e3` | FI homepage metadata + request-aware JSON-LD |

## Production curl evidence (2026-10-26)

| Probe | Result |
| --- | --- |
| `GET /llms.txt` | 200 — includes **When to use Feature Intelligence** + canonical host URLs |
| `GET /sitemap.xml` | 200 — valid urlset for `/`, `/requests`, `/triage`, `/insights`, `/chat`, `/requests/new` |
| `GET /.well-known/mcp` | 200 — `serverCard` → server-card.json |
| `GET /.well-known/mcp/server-card.json` | 200 — `streamable-http` → `/api/mcp`, eight tools |
| `POST /api/mcp` `initialize` | 200 — `feature-intelligence` serverInfo |
| `GET /` + `Accept: text/markdown` | `text/markdown`, `Vary: Accept`, body ≥500 chars |
| Unknown path + `Accept: text/markdown` | 404 + Markdown body with `/llms.txt` link |
| `GET /` HTML | JSON-LD `SoftwareApplication`; extracted text content ≫500 chars |

## Is Agentic CLI

| Run | `scanned_at` | Score | Notes |
| --- | --- | --- | --- |
| Pre-build | `2026-10-26T02:53:40.335Z` | 59 | Baseline in [adversarial review](./20261025-fi-adversarial-review.md) |
| Post-deploy CLI | same timestamp | 59 | **Cached report** — `servedFromCache: true` on scan stream API |

**Action for G-A4:** Manual **Rescan** at [is-agentic.com/scan/meta-cto-two.vercel.app](https://is-agentic.com/scan/meta-cto-two.vercel.app), then `AGENTIC_CHECK_URL=meta-cto-two.vercel.app pnpm agentic:check` and confirm `scanned_at` advances and essential checks pass.

## Automated tests

`pnpm --filter web test` — contract tests for markdown home, markdown 404, sitemap, MCP smoke (local route handlers).

## Related

- [feature-intelligence-agentic-discoverability.md](../specs/feature-intelligence-agentic-discoverability.md)
- [tasks/feature-intelligence-agentic-discoverability.md](../tasks/feature-intelligence-agentic-discoverability.md)
- [ADR 0005](../adr/0005-fi-agentic-discoverability-and-mcp.md)
