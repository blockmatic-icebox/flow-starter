const toolPaths = {
  confirm_request: {
    operationId: "confirmRequest",
    requestBody: {
      properties: {
        intakeLinkedRequestId: {
          format: "uuid",
          nullable: true,
          type: "string",
        },
        problemStatement: { maxLength: 4000, minLength: 1, type: "string" },
        requestId: { format: "uuid", type: "string" },
      },
      required: ["requestId", "problemStatement"],
      type: "object",
    },
    summary: "Publish a draft after user confirms problem statement",
  },
  get_insights: {
    operationId: "getInsights",
    requestBody: {
      properties: {
        range: { enum: ["7d", "30d", "90d", "all"], type: "string" },
      },
      type: "object",
    },
    summary: "North-star product metrics",
  },
  get_request: {
    operationId: "getRequest",
    requestBody: {
      properties: { requestId: { format: "uuid", type: "string" } },
      required: ["requestId"],
      type: "object",
    },
    summary: "Get feature request by id",
  },
  list_triage_queue: {
    operationId: "listTriageQueue",
    requestBody: { properties: {}, type: "object" },
    summary: "Published requests awaiting PM disposition",
  },
  search_requests: {
    operationId: "searchRequests",
    requestBody: {
      properties: {
        limit: { maximum: 50, minimum: 1, type: "integer" },
        query: { type: "string" },
        themeKey: { type: "string" },
      },
      type: "object",
    },
    summary: "Search published feature requests",
  },
  set_disposition: {
    operationId: "setDisposition",
    requestBody: {
      properties: {
        disposition: {
          enum: ["merge", "monitor", "decline", "needs_discussion"],
          type: "string",
        },
        dispositionRationale: { minLength: 1, type: "string" },
        mergeTargetId: { format: "uuid", type: "string" },
        requestId: { format: "uuid", type: "string" },
      },
      required: ["requestId", "disposition", "dispositionRationale"],
      type: "object",
    },
    summary: "Set PM disposition on a published request",
  },
  submit_request: {
    operationId: "submitRequest",
    requestBody: {
      properties: {
        description: { maxLength: 8000, minLength: 1, type: "string" },
        source: {
          enum: ["customer", "prospect", "support", "internal"],
          type: "string",
        },
        title: { maxLength: 500, minLength: 1, type: "string" },
      },
      required: ["title", "description", "source"],
      type: "object",
    },
    summary: "Create draft and run triage harness",
  },
  support_request: {
    operationId: "supportRequest",
    requestBody: {
      properties: {
        requestId: { format: "uuid", type: "string" },
        supporterKey: { maxLength: 200, minLength: 1, type: "string" },
      },
      required: ["requestId", "supporterKey"],
      type: "object",
    },
    summary: "Add support for a published request",
  },
} as const;

export const buildOpenApiDocument = (origin: string) => {
  const toolPathEntries = Object.entries(toolPaths).map(([name, spec]) => [
    `/api/agents/tools/${name}`,
    {
      post: {
        description: `Invoke MCP tool \`${name}\` via Streamable HTTP at \`${origin}/api/mcp\` (JSON-RPC). This path documents the tool contract for function-calling and OpenAPI clients.`,
        operationId: spec.operationId,
        requestBody: {
          content: { "application/json": { schema: spec.requestBody } },
          required: true,
        },
        responses: {
          "200": {
            content: {
              "application/json": {
                schema: {
                  properties: { result: { type: "object" } },
                  type: "object",
                },
              },
            },
            description: "Tool result (via MCP transport)",
          },
        },
        summary: spec.summary,
        tags: ["mcp-tools"],
        "x-mcp-tool": name,
        "x-mcp-transport": `${origin}/api/mcp`,
      },
    },
  ]);

  const paths = {
    "/api/chat": {
      post: {
        description:
          "Ask-only product Q&A (Vercel AI SDK UI stream). No FI mutations.",
        operationId: "fiAskOnlyChat",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  messages: {
                    items: {
                      properties: {
                        content: { type: "string" },
                        role: { enum: ["user", "assistant"], type: "string" },
                      },
                      required: ["role", "content"],
                      type: "object",
                    },
                    type: "array",
                  },
                },
                required: ["messages"],
                type: "object",
              },
            },
          },
          required: true,
        },
        responses: {
          "200": { description: "text/event-stream UI message stream" },
          "503": { description: "ANTHROPIC_API_KEY not configured" },
        },
        summary: "Ask-only chat (no tools)",
        tags: ["chat"],
      },
    },
    "/api/mcp": {
      post: {
        description:
          "Model Context Protocol Streamable HTTP endpoint. Send JSON-RPC initialize, tools/list, and tools/call messages.",
        operationId: "mcpStreamableHttp",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": {
            content: { "application/json": { schema: { type: "object" } } },
            description: "MCP JSON-RPC response",
          },
          "406": { description: "Invalid Accept header for Streamable HTTP" },
          "429": { description: "Rate limited" },
        },
        summary: "MCP Streamable HTTP transport",
        tags: ["mcp"],
      },
    },
    ...Object.fromEntries(toolPathEntries),
  };

  return {
    externalDocs: {
      description: "Developer portal",
      url: `${origin}/developers`,
    },
    info: {
      description:
        "Feature Intelligence — product feature request triage for Meta CTO assessment. Agents should use Streamable HTTP MCP at /api/mcp; REST paths document tool schemas for function calling.",
      title: "Feature Intelligence API",
      version: "1.0.0",
    },
    openapi: "3.1.0",
    paths: Object.fromEntries(
      Object.entries(paths).toSorted(([a], [b]) => a.localeCompare(b))
    ),
    servers: [{ url: origin }],
    tags: [
      { description: "Streamable HTTP MCP", name: "mcp" },
      { description: "Documented MCP tool contracts", name: "mcp-tools" },
      { description: "Human ask-only assistant", name: "chat" },
    ],
  };
};
