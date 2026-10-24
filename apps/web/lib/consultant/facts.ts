export const consultantFacts = {
  adoptersCan: [
    "Replace PRODUCT.md and DESIGN.md with their product contract",
    "Swap Acme fixtures and routing keywords in @repo/genui",
    "Extend the component registry and React views",
    "Use the consultant pattern as a template for capability-first tools",
    "Enable CI workflows when the remote repository is ready",
  ],
  name: "Flow Starter",
  planned: [
    "eve agent runtime with defineTool adapters to shared actions",
    "Better Auth with GitHub OAuth",
    "Neon branch-per-preview automation and Vercel preview database wiring",
    "Authenticated /dev workspace (conversation, canvas) per ADR 005",
    "Full external invocation boundary beyond public read-only MCP",
  ],
  shipped: [
    "Next.js 16 App Router app in apps/web",
    "@repo/genui: select → compile → render with OpenUI Lang",
    "POST /api/genui/compose NDJSON streaming",
    "/genui-demo integration route",
    "Optional AI Gateway tier-3 answers in GenUI when AI_GATEWAY_API_KEY is set",
    "Site consultant chat sidebar and read-only MCP (ADR 0010)",
    "Shared UI package (shadcn + Base UI)",
    "pnpm + Turborepo workspace, Flow workflow docs, agent skills manifest",
    "@repo/db: Neon + Drizzle baseline, migrations, and Neon Local proxy (pnpm db:start)",
  ],
  summary:
    "An opinionated Next.js and React monorepo baseline for agentic applications with OpenUI Lang GenUI, composition tiers, and Vercel-friendly defaults.",
  technologies: [
    "Next.js 16",
    "React 19",
    "TypeScript",
    "OpenUI Lang (@openuidev/lang-core, @openuidev/react-lang)",
    "Vercel AI SDK 7",
    "Tailwind CSS 4",
    "Zod",
    "MCP Streamable HTTP for external consultant access",
  ],
} as const;

export const describeArchitecture = () =>
  [
    `${consultantFacts.name}: ${consultantFacts.summary}`,
    "",
    "Implemented today:",
    ...consultantFacts.shipped.map((item) => `- ${item}`),
    "",
    "Planned (documented, not shipped):",
    ...consultantFacts.planned.map((item) => `- ${item}`),
  ].join("\n");

export const describeTechnologies = () =>
  [
    "Core technologies in this starter:",
    ...consultantFacts.technologies.map((item) => `- ${item}`),
  ].join("\n");

export const describeCapabilities = () =>
  [
    "What you can do with Flow Starter out of the box:",
    ...consultantFacts.adoptersCan.map((item) => `- ${item}`),
    "",
    "GenUI demo: open /genui-demo or ask the in-app consultant to open the GenUI demo.",
    "External agents: connect to /api/mcp (HTTPS) for read-only consultant tools.",
  ].join("\n");
