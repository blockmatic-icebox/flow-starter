# Flow

Flow is an open-source, opinionated starter for agentic apps built with Vercel technology. It demonstrates how people and agents share actions, context, and persistent state. The planned repository explorer at `/dev` teaches the pattern; adopters replace its tools, data, and views with their own domain.

**This repository is the starter baseline.** The documents define the product; the agent, canvas, authentication, voice, and external integrations are not implemented yet.

## Documents

Root contracts own scope and implementation intent. [GLOSSARY.md](GLOSSARY.md) owns vocabulary; [docs/adr/](docs/adr/) records architectural decisions; [docs/research/](docs/research/) holds dated evidence. Accepted direction stays in the root contracts and ADRs.

| Document | Role |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | Scope and behavior |
| [DESIGN.md](DESIGN.md) | Visual system and tokens |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technical boundaries |
| [ROADMAP.md](ROADMAP.md) | Implementation sequence and acceptance |
| [GLOSSARY.md](GLOSSARY.md) | Ubiquitous language for Flow |
| [docs/adr/](docs/adr/) | Recorded architecture decisions |
| [Agent domain docs](docs/agents/domain.md) | Glossary, relevant ADRs, and where code lives |
| [Voice research](docs/research/voice-surfaces.md) | Dated evidence: voice integration gates |

## What runs today

- **Turborepo** monorepo with pnpm
- **`apps/web`** — Next.js App Router starter (home page only; no `/dev`, chat, canvas, or sign-in)
- **`packages/ui`** — shared shadcn + Base UI components
- **`packages/ts`** — shared TypeScript configs
- System light/dark theme with **`d`** to toggle (see home page)
- Local HTTPS via **Portless**

## Specified, not built

The initial release targets grounded repository exploration, text/table/diagram artifacts, shared UI/agent actions, and persistent canvases. The adoption milestone is one custom action callable through both a UI control and the agent. All example interactions remain at `/dev`; activity labels describe actual work. Voice, external coding-agent access, dependency ownership exploration, charts, and videos are follow-on work. Adopters can retain `/dev` or disable its endpoints while reusing the foundation.

[ROADMAP.md](ROADMAP.md) sequences implementation, including automated checks, isolated previews, deployment, and recovery. Planned persistence uses **Neon PostgreSQL + Drizzle** through the Vercel-managed integration, starting on its Free plan. See [Persistence and flow](ARCHITECTURE.md#5-persistence-and-flow). **No environment variables are required** to run the existing starter.

## Adoption path (planned)

Keep identity, validation, shared actions, persistence, and recovery. Configure credentials, model, instructions, and repository. Replace the example tools, data, prompts, and views. The implementation roadmap requires a verified extension guide and a bounded evaluation workflow before initial release.

## Prerequisites

- Node.js 24+
- [pnpm](https://pnpm.io/) 12+

```sh
pnpm install
```

## Local web (Portless)

Local development is at **https://flow.localhost**. Bind ports are ephemeral; use the configured name, not a port.

One-time on your machine (may prompt for sudo or Keychain):

```sh
pnpm setup:portless
```

Daily development:

```sh
pnpm dev
```

`pnpm dev` runs Turborepo; the `web` app’s `dev` script runs through Portless (`dev:app` → `next dev`).

| Goal                  | Command                            |
| --------------------- | ---------------------------------- |
| Bypass Portless       | `pnpm --filter web dev:app`        |
| Disable proxy for web | `PORTLESS=0 pnpm --filter web dev` |
| Diagnose              | `pnpm exec portless doctor`        |
| Safari `.localhost`   | `pnpm exec portless hosts sync`    |

Linked git worktrees get a branch prefix (e.g. `https://fix-ui.flow.localhost`).

## Browser development

Verify UI work in a real browser with [agent-browser](https://github.com/vercel-labs/agent-browser). Install the CLI and its [Agent Skill](https://skills.sh/vercel-labs/agent-browser) globally once:

```sh
npm i -g agent-browser && agent-browser install
npx skills@latest add vercel-labs/agent-browser -g -y
```

The CLI and skill are global development tools, not application dependencies. The project also locks `agent-browser` in [skills-lock.json](skills-lock.json); run `pnpm skills:install` to restore `.agents/skills/` for agents in this repo.

With `pnpm dev` running, smoke-test the CLI against **`https://flow.localhost`** (or your worktree host). Read `agent-browser skills get core` before other commands. If the browser reports an untrusted certificate, run `pnpm setup:portless` once—do not disable TLS verification by default.

```sh
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix smoke)"
agent-browser open https://flow.localhost
agent-browser snapshot -i
agent-browser errors
agent-browser close
```

Use the URL printed by `pnpm --filter web dev:app` only to troubleshoot a blocked HTTPS connection or certificate trust.

Follow [AGENTS.md](AGENTS.md#tools) for UI verification requirements. Leave screenshots and other local browser artifacts uncommitted.

## Common tasks

```sh
pnpm build          # production build (Turbo)
pnpm check-types    # TypeScript across packages
pnpm lint           # oxlint + oxfmt check
pnpm lint:fix       # fix lint and format
pnpm qa             # lint + types
pnpm skills:install # restore .agents/skills from skills-lock.json
pnpm skills:update  # update the locked skill catalog
```

## Workspace

| Package       | Role                      |
| ------------- | ------------------------- |
| `apps/web`    | Next.js App Router        |
| `packages/ui` | Shared UI (shadcn)        |
| `packages/ts` | Shared TypeScript configs |

## Deepsec (optional)

Security scanning is configured under [`.deepsec/`](.deepsec/) (project id **`flow`**). From the repo root: `pnpm deepsec scan`, `pnpm deepsec process -- --diff origin/main`. PR CI runs when `AI_GATEWAY_API_KEY` is set in the repository (see [`.github/workflows/deepsec.yml`](.github/workflows/deepsec.yml)). Do not commit API keys.
