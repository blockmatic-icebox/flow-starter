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

## Flow Skills

Methodology and delivery skills come from [gaboesquivel/flow-skills](https://github.com/gaboesquivel/flow-skills). There is no custom Flow phase router—invoke skills only when a task needs them.

### Install and verify (Cursor, project scope)

```bash
npx skills add gaboesquivel/flow-skills --skill '*' -a cursor -y
```

After clone or when [`.agents/skills-lock.json`](.agents/skills-lock.json) changes, restore project skills:

```bash
npx skills add gaboesquivel/flow-skills --skill '*' -a cursor -y
pnpm --dir .agents skills:install
```

Confirm skills on disk under `.agents/skills/` (for example `flow`, `explore`, `grill`, `to-spec`, `to-tickets`, `implement`, `review`, `retro`, `jtbd`, `competitors`, `write-agents`, `write-humans`, `tldr`) and list them:

```bash
npx skills list -a cursor
```

Read each skill’s `SKILL.md` before claiming it was loaded. Clients without slash commands can open `.agents/skills/<name>/SKILL.md` directly.

| Situation                                                   | Skill        |
| ----------------------------------------------------------- | ------------ |
| Align product, design, architecture after meaningful change | `flow`       |
| Understand problem and repo before planning                 | `explore`    |
| Stress-test a plan                                          | `grill`      |
| Numbered spec in `docs/specs/`                              | `to-spec`    |
| GitHub implementation slices                                | `to-tickets` |
| Authorized implementation                                   | `implement`  |
| Review diff or working tree                                 | `review`     |
| Session learning                                            | `retro`      |

### Stack skills

The same [`.agents/skills-lock.json`](.agents/skills-lock.json) also lists framework helpers (Vercel, Matt, and others). `pnpm --dir .agents skills:install` restores the full lockfile after clone.

### Tracker and contracts

- **GitHub Issues** — canonical specs and tasks when using `to-tickets`.
- **Root contracts** — `PRODUCT.md`, `DESIGN.md`, `ARCHITECTURE.md`; specs under `docs/specs/`, decisions under `docs/decisions/` when needed.

## Docs

- [PRODUCT.md](PRODUCT.md) · [DESIGN.md](DESIGN.md) · [ARCHITECTURE.md](ARCHITECTURE.md)
- [ADR 0001 — Use Flow Factory](docs/adr/0001-use-flow-factory.md)
- [AGENTS.md](AGENTS.md) — short pointers for coding agents
