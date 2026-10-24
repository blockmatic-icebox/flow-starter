export const flowStarterFacts = {
  applications: {
    flow: "apps/flow (package flow-app): Flow methodology experience — Generative UI at /, Flow Agent sidebar, fixture lab, MCP and compose APIs.",
    web: "apps/web: product-neutral Next.js starter — minimal homepage, shared UI, optional database; no Flow Agent or GenUI demo.",
  },
  name: "Flow Starter",
  planned: [
    "Full Better Auth runtime (OAuth, sessions, protected routes) — schema groundwork only today",
    "eve agent runtime with defineTool adapters to shared actions",
    "Neon branch-per-preview automation and Vercel preview database wiring",
    "Authenticated /dev workspace (conversation, canvas) per ADR 005",
    "Expanded external invocation beyond public read-only MCP",
  ],
  shipped: [
    "Two Next.js 16 applications: apps/web (product) and apps/flow (Flow experience)",
    "@repo/genui: select → compile → render with OpenUI Lang",
    "POST /api/genui/compose NDJSON streaming in apps/flow",
    "Flow Agent chat and read-only MCP in apps/flow (ADR 0010)",
    "Better Auth core tables in @repo/db (schema only, no auth UI)",
    "Shared UI package (shadcn + Base UI)",
    "pnpm + Turborepo workspace, Flow workflow docs, agent skills manifest",
    "@repo/db: Neon + Drizzle baseline, migrations, and Neon Local proxy (pnpm db:start)",
  ],
  summary:
    "An opinionated Next.js and React monorepo baseline for agentic applications with OpenUI Lang GenUI, composition tiers, route-first colocation, and Vercel-friendly defaults.",
  technologies: [
    "Next.js 16 App Router",
    "React 19",
    "TypeScript",
    "pnpm and Turborepo",
    "OpenUI Lang (@openuidev/lang-core, @openuidev/react-lang)",
    "Vercel AI SDK 7",
    "Tailwind CSS 4",
    "Drizzle ORM and Neon",
    "Zod",
    "MCP Streamable HTTP (read-only Flow knowledge tools)",
  ],
  workflow:
    "Explore → Specify → Plan → Build → Review → Ship — see docs/workflow/flow.md",
} as const;

export const describeArchitecture = () =>
  [
    `${flowStarterFacts.name}: ${flowStarterFacts.summary}`,
    "",
    "Applications:",
    `- ${flowStarterFacts.applications.web}`,
    `- ${flowStarterFacts.applications.flow}`,
    "",
    "Implemented today:",
    ...flowStarterFacts.shipped.map((item) => `- ${item}`),
    "",
    "Planned (documented, not shipped):",
    ...flowStarterFacts.planned.map((item) => `- ${item}`),
  ].join("\n");

export const describeTechnologies = () =>
  [
    "Core technologies in this starter:",
    ...flowStarterFacts.technologies.map((item) => `- ${item}`),
  ].join("\n");

export const describeCapabilities = () =>
  [
    "Flow app (/ on apps/flow): Generative UI compositions and Flow Agent for methodology and architecture questions.",
    "Product app (apps/web): fork PRODUCT.md and DESIGN.md, add routes with route-first colocation — no demo agent imposed.",
    "External agents: HTTPS /api/mcp on the Flow app with approved read-only knowledge tools only.",
    "GenUI fixture lab: /genui-lab/fixtures/* and /__genui__/fixtures/* rewrites for regression fixtures (Acme catalog is fictional test data).",
  ].join("\n");

export const describeWorkflow = () =>
  [
    "Flow methodology:",
    flowStarterFacts.workflow,
    "",
    "Authority: human intent, PRODUCT.md / DESIGN.md / ARCHITECTURE.md, this workflow (docs/workflow/flow.md), installed skills, then code and tests.",
    "Stages are activities — use the least process needed. Small fixes may go Build → Review → Ship; new capabilities may need Explore and Specify first.",
    "Use docs/workflow/flow.md for stage inputs, outputs, and documentation expectations.",
  ].join("\n");
