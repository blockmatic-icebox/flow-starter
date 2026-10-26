# Flow Starter — agentic application shell

Web application built with Flow Factory. MCP-first and API-first web starter: GenUI (OpenUI Lang + shadcn), Eve agent tools, and is-agentic discovery surfaces. Branch **`simple`** — see [docs/specs/001-lean-agentic-starter.md](docs/specs/001-lean-agentic-starter.md).

## Setup

Requires Node.js 24+ and pnpm 12+.

```bash
pnpm setup
cp .env.defaults.example .env   # optional keys below
pnpm dev                        # https://app.localhost (portless) or pnpm --filter web dev:app --port 3000
```

| Variable             | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `AI_GATEWAY_API_KEY` | Open-ended UI generation                        |
| `ANTHROPIC_API_KEY`  | Optional sidebar chat API                       |
| `DATABASE_URL`       | Optional — runs migrations on Vercel build only |

```bash
pnpm qa
pnpm test:browser
pnpm exec eve eval smoke
pnpm agentic:check
```

## Matt Pocock workflow

Development on **`simple`** uses [Matt Pocock’s published engineering skills](https://github.com/mattpocock/skills) for discovery, specs, and implementation. There is no custom Flow phase router—load skills only when a task needs them. Full experiment context: [docs/simplified-flow-prd.md](docs/simplified-flow-prd.md).

### Install and refresh skills

Project skills are declared in [`.agents/skills-lock.json`](.agents/skills-lock.json). After clone or lockfile changes:

```bash
pnpm --dir .agents skills:install
```

Verify skills exist on disk under `.agents/skills/` (symlinks into `.agents/.agents/skills/`). A lockfile entry does not mean a skill is loaded in your client.

**Matt workflow skills installed for this experiment** (plus dependencies such as `domain-modeling`, `tdd`, `code-review`, `setup-matt-pocock-skills`): `grilling`, `grill-with-docs`, `wayfinder`, `research`, `prototype`, `to-spec`, `to-tickets`, `implement`, `implement-spec`, `diagnosing-bugs`, `retro`.

Run **`setup-matt-pocock-skills`** once per repo to configure GitHub Issues labels and domain doc layout before `to-spec` / `to-tickets`.

### How to invoke (Cursor and slash-capable clients)

| Situation | Skill | Notes |
| --- | --- | --- |
| Vague product or domain change | `/grill-with-docs` | Needs `grilling` + `domain-modeling`; builds glossary/ADRs sparingly |
| Very large, foggy effort | `/wayfinder` | Decision map on the tracker—not a default kickoff |
| Outside evidence matters | `research` | Sourced markdown in-repo when useful |
| Interaction or logic uncertainty | `/prototype` | Throwaway experiment; human reviews |
| Settled multi-session work | `/to-spec` | Publishes a GitHub spec issue from the conversation |
| Spec needs implementable slices | `/to-tickets` | Child issues and blockers on GitHub |
| One clear change | `/implement` | Skip spec/ticket ceremony when proportional |
| Parallel implementation tickets | `/implement-spec` | Only when workers and worktrees are actually isolated |
| Hard bug or regression | `/diagnosing-bugs` | Repro and evidence before behavior changes |
| Session post-mortem | `/retro` | Targeted improvements; no auto self-improve loop |

Typical chain for large work: **grill-with-docs → to-spec → to-tickets → implement / implement-spec → review → retro**. Use only the stages the task needs.

Clients without slash commands can open the matching `SKILL.md` under `.agents/skills/<name>/` after install.

### Tracker and contracts

- **GitHub Issues** — canonical multi-session specs and task issues (native sub-issues and blockers where supported).
- **Root contracts** — `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md` describe current verified behavior; link issues and [docs/adr/](docs/adr/) for consequential decisions (Matt `domain-modeling` convention).

Example prompts:

- “Use `grill-with-docs` to clarify this product’s main user jobs, vocabulary, and priorities. Challenge assumptions and recommend research or a prototype where useful.”
- “Scope is settled—use `to-spec` for the agreed journey on GitHub, then `to-tickets` if multiple sessions are needed.”
- “Implement the first unblocked issue, verify through an actual MCP client, and report checks separately from journey verification.”

## Docs

- [PRODUCT.md](PRODUCT.md) · [DESIGN.md](DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md)
- [ADR 0001 — Use Flow Factory](docs/adr/0001-use-flow-factory.md)
- [AGENTS.md](AGENTS.md) — short pointers for coding agents
