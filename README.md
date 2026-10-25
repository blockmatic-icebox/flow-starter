# Flow Factory

An opinionated, agentic software development starter for building products with humans and AI agents.

Flow Factory combines a modern TypeScript foundation with Flow, a lightweight methodology for exploring, specifying, building, reviewing, and shipping software.

## Create a project

Requires Git and Node.js 24+. The generated project uses pnpm 12+.

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/gaboesquivel/flow-factory/main/.agents/tooling/setup/install.sh)"
```

Enter your project name when prompted.

The installer creates a new project directory, configures its identity, prepares its initial documentation, and starts a fresh Git history. It does not install application dependencies.

## Develop

```bash
cd your-project
pnpm setup
pnpm dev
```

## Learn more

- [Flow for humans](.agents/flow/README.md)
- [Working with Flow](.agents/flow/guides/working-with-flow.md)
- [Flow Factory foundation](.agents/flow/factory.md)
- [Architecture](.agents/flow/architecture.md)
