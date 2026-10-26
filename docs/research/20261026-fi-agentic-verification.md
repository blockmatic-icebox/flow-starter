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

**Evening re-check:** Same host — markdown negotiation, `/.well-known/mcp` 200, and `llms.txt` canonical URLs still pass; **G-A4** blocked only on Is Agentic cache until Rescan.

## External MCP access re-verification (2026-10-25)

Context: external agent (Astra) could not verify MCP — DNS failure in client environment, Vercel connector 403 on protection-bypass APIs, and probes against homepage or guessed `/mcp`. Re-checked from a standard network:

| Probe | Result |
| --- | --- |
| `POST /api/mcp` `initialize` | 200 — `feature-intelligence` |
| `POST /api/mcp` `tools/list` | 200 — eight tools |
| `POST /api/mcp` `tools/call` `search_requests` `query: CSV` | 200 — seeded CSV export rows |
| `POST /api/mcp` `Accept: application/json` only | 406 |
| `GET /.well-known/mcp/server-card.json` | 200 — endpoint `https://meta-cto-two.vercel.app/api/mcp`, `authentication.required: false` |

**Build follow-up:** `POST /mcp` alias (same handler as `/api/mcp`) ships in repo; production needs deploy from `meta-cto` before alias is live. Canonical URL for clients remains `/api/mcp`.

## Astra MCP diagnosis and alias drift (2026-10-26)

**Context:** External agent (Astra) reported Vercel connector 403 on deployment protection-bypass APIs, DNS resolution failure for direct `curl`, failed web retrieval for `/` and `/llms.txt`, and no successful MCP handshake. Probes from a standard network showed the application healthy on the **public** alias; failures do not establish a broken MCP server when the wrong host, URL, or client network is used.

### Vercel alias vs `meta-cto` HEAD (pre-promote)

| Alias | Deployment | Commit (short) | `target` |
| --- | --- | --- | --- |
| `meta-cto-two.vercel.app` | `dpl_2q3xvUWKtAyu7cqBxjNM4WVkSXjr` | `f17becd` | production |
| `meta-cto-git-meta-cto-gaboesquivel.vercel.app` | `dpl_CHXobQAgdja3yzAWAYybMaFZiv9M` | `d7b477c` | preview |

Repo `origin/meta-cto` at `d7b477c` includes `POST /mcp` re-export; production alias **lagged** until promote (see post-promote section below).

### Symptom → cause (Astra vs application)

| Astra symptom | Likely cause |
| --- | --- |
| 403 on `read_protection_bypass` / deployment alias APIs | Vercel **team API authorization** for the connector identity—not MCP endpoint health. Public MCP on `meta-cto-two` does not require bypass APIs. |
| `Could not resolve host` + failed web fetch | **Client DNS/egress** to `*.vercel.app`—not remedied in app code. |
| No `initialize` / `tools/list` | Wrong URL (`/` or guessed `/mcp` on stale prod), wrong host (`meta-cto-gaboesquivel.vercel.app` → **401**), or missing `Accept: application/json, text/event-stream` (**406**). |

### Pre-promote production probes (`meta-cto-two.vercel.app`)

| Probe | Result |
| --- | --- |
| `GET /`, `GET /llms.txt` | 200 |
| `POST /api/mcp` `initialize` | 200 — `feature-intelligence` |
| `POST /api/mcp` `tools/call` `search_requests` | 200 |
| `POST /mcp` `initialize` | 405 — route not on deployment `f17becd` |
| `POST /api/mcp` on `meta-cto-gaboesquivel.vercel.app` | 401 — Deployment Protection |

**Canonical MCP:** `https://meta-cto-two.vercel.app/api/mcp` — Streamable HTTP, no bearer on assessment alias. Tools call `@repo/fi` directly (not Eve HTTP).

### Post-promote verification

Production promote via `vercel promote` (CLI) → deployment `dpl_26uHpNeQU5ja6kqADS7wsCzZjz8f` (`meta-7nta0a0em-gaboesquivel.vercel.app`), commit `d7b477c`, aliases include `meta-cto-two.vercel.app`.

| Probe | Result |
| --- | --- |
| `POST /api/mcp` `initialize` | 200 — `feature-intelligence` |
| `POST /api/mcp` `tools/list` | 200 — eight tools |
| `POST /api/mcp` `tools/call` `search_requests` | 200 |
| `POST /mcp` `initialize` | 200 (was 405 on deployment `f17becd`) |
| `AGENTIC_CHECK_URL=meta-cto-two.vercel.app fi --mcp-smoke` | exit 0 |

**Preview-only deploys:** Recent Git pushes on `meta-cto` often land as Preview (`target: null`) while `meta-cto-two` stayed on an older Production deployment until explicit promote/production deploy—do not infer MCP health from preview URLs alone.

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
