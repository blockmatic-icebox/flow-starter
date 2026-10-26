export interface FiMcpToolCard {
  description: string;
  name: string;
}

export const fiMcpToolCatalog: FiMcpToolCard[] = [
  {
    description:
      "Search published feature requests by text and optional theme key with pagination.",
    name: "search_requests",
  },
  {
    description:
      "Get a feature request by id with duplicates and support count.",
    name: "get_request",
  },
  {
    description: "List published requests awaiting PM disposition.",
    name: "list_triage_queue",
  },
  {
    description: "North-star product metrics for feature intelligence.",
    name: "get_insights",
  },
  {
    description:
      "Create a draft feature request and run AI triage; returns pending_confirm preview.",
    name: "submit_request",
  },
  {
    description:
      "Publish a draft request after the user confirms or edits the problem statement.",
    name: "confirm_request",
  },
  {
    description: "Add support for a published feature request.",
    name: "support_request",
  },
  {
    description: "Set PM disposition on a published feature request.",
    name: "set_disposition",
  },
];

export const buildMcpServerCard = (origin: string) => ({
  authentication: { required: false },
  description:
    "Search feature requests, triage queue, and product insights for Meta CTO Feature Intelligence. Assessment demo exposes read and write tools without bearer auth.",
  serverInfo: {
    name: "feature-intelligence",
    title: "Feature Intelligence",
    version: "1.0.0",
  },
  tools: fiMcpToolCatalog,
  transport: {
    endpoint: `${origin}/api/mcp`,
    type: "streamable-http",
  },
  version: "1.0",
});

export const buildMcpRegistryManifest = (origin: string) => ({
  mcpServers: {
    "feature-intelligence": {
      transport: {
        type: "http",
        url: `${origin}/api/mcp`,
      },
    },
  },
  serverCard: `${origin}/.well-known/mcp/server-card.json`,
});

export const buildAiCatalog = (origin: string) => ({
  servers: [
    {
      description:
        "Feature Intelligence MCP — search, triage, insights, and workflow tools for the assessment demo.",
      name: "feature-intelligence",
      transport: {
        type: "streamable-http",
        url: `${origin}/api/mcp`,
      },
      url: `${origin}/.well-known/mcp/server-card.json`,
    },
  ],
  version: "1.0",
});
