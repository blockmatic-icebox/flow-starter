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

const mcpToolSchemaName = (name: string) =>
  `McpTool_${name.replaceAll("-", "_")}`;

const mcpToolComponents = Object.fromEntries(
  Object.entries(toolPaths).map(([name, spec]) => [
    mcpToolSchemaName(name),
    {
      description: spec.summary,
      "x-mcp-tool": name,
      ...spec.requestBody,
    },
  ])
);

const apiVersionParameter = {
  description:
    "Optional API version. v1 is the current stable surface for this assessment demo.",
  in: "header",
  name: "X-API-Version",
  required: false,
  schema: { default: "v1", enum: ["v1"], type: "string" },
};

const errorJsonContent = {
  "application/json": {
    schema: { $ref: "#/components/schemas/ApiError" },
  },
  "application/problem+json": {
    schema: { $ref: "#/components/schemas/ProblemDetails" },
  },
};

const openApiComponents = {
  headers: {
    RateLimitLimit: {
      description: "Maximum requests allowed in the current window.",
      schema: { example: "120", type: "string" },
    },
    RateLimitPolicy: {
      description: "Quota policy; see IETF RateLimit fields draft.",
      schema: { example: "120;w=60", type: "string" },
    },
    RateLimitRemaining: {
      description: "Requests remaining in the current window.",
      schema: { example: "119", type: "string" },
    },
    RateLimitReset: {
      description: "Seconds until the quota window resets.",
      schema: { example: "45", type: "string" },
    },
    RetryAfter: {
      description: "Seconds to wait before retrying after HTTP 429.",
      schema: { example: "60", type: "integer" },
    },
  },
  parameters: {
    ApiVersionHeader: apiVersionParameter,
  },
  responses: {
    BadRequest: {
      content: errorJsonContent,
      description: "Invalid request",
    },
    MethodNotAllowed: {
      content: errorJsonContent,
      description: "HTTP method not supported",
    },
    NotAcceptable: {
      content: errorJsonContent,
      description: "Invalid Accept header",
    },
    RateLimited: {
      content: errorJsonContent,
      description: "Rate limit exceeded",
      headers: {
        "RateLimit-Limit": { $ref: "#/components/headers/RateLimitLimit" },
        "RateLimit-Policy": { $ref: "#/components/headers/RateLimitPolicy" },
        "RateLimit-Remaining": {
          $ref: "#/components/headers/RateLimitRemaining",
        },
        "RateLimit-Reset": { $ref: "#/components/headers/RateLimitReset" },
        "Retry-After": { $ref: "#/components/headers/RetryAfter" },
      },
    },
    ServerError: {
      content: errorJsonContent,
      description: "Unexpected server error",
    },
    ServiceUnavailable: {
      content: errorJsonContent,
      description: "Dependency not configured or temporarily unavailable",
    },
  },
  schemas: {
    ApiError: {
      properties: {
        code: {
          description: "Machine-readable error code",
          type: "string",
        },
        error: {
          description: "Human-readable error message",
          type: "string",
        },
        resolution: {
          description: "Suggested remediation for agents and developers",
          type: "string",
        },
        type: {
          description: "Error type URI",
          format: "uri",
          type: "string",
        },
      },
      required: ["code", "error", "resolution", "type"],
      type: "object",
    },
    ProblemDetails: {
      description: "RFC 9457 problem details (parallel to ApiError JSON shape)",
      properties: {
        detail: { type: "string" },
        status: { type: "integer" },
        title: { type: "string" },
        type: { format: "uri", type: "string" },
      },
      required: ["type", "title", "status"],
      type: "object",
    },
    ...mcpToolComponents,
  },
};

const stdErrorResponses = {
  "400": { $ref: "#/components/responses/BadRequest" },
  "405": { $ref: "#/components/responses/MethodNotAllowed" },
  "500": { $ref: "#/components/responses/ServerError" },
};

const mcpOperation = {
  description:
    "Model Context Protocol Streamable HTTP endpoint. Send JSON-RPC initialize, tools/list, and tools/call messages. Tool input schemas are cataloged under components.schemas with x-mcp-tool.",
  operationId: "mcpStreamableHttp",
  parameters: [{ $ref: "#/components/parameters/ApiVersionHeader" }],
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
      headers: {
        "RateLimit-Limit": { $ref: "#/components/headers/RateLimitLimit" },
        "RateLimit-Policy": { $ref: "#/components/headers/RateLimitPolicy" },
        "RateLimit-Remaining": {
          $ref: "#/components/headers/RateLimitRemaining",
        },
        "RateLimit-Reset": { $ref: "#/components/headers/RateLimitReset" },
      },
    },
    "406": { $ref: "#/components/responses/NotAcceptable" },
    "429": { $ref: "#/components/responses/RateLimited" },
    ...stdErrorResponses,
  },
  summary: "MCP Streamable HTTP transport",
  tags: ["mcp"],
};

const chatOperation = {
  description:
    "Ask-only product Q&A (Vercel AI SDK UI stream). No FI mutations.",
  operationId: "fiAskOnlyChat",
  parameters: [{ $ref: "#/components/parameters/ApiVersionHeader" }],
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
    "400": { $ref: "#/components/responses/BadRequest" },
    "405": { $ref: "#/components/responses/MethodNotAllowed" },
    "503": { $ref: "#/components/responses/ServiceUnavailable" },
  },
  summary: "Ask-only chat (no tools)",
  tags: ["chat"],
};

const genuiOperation = {
  description:
    "Ask Hunch GenUI composition stream (NDJSON). Read-only grounded views; does not mutate FI domain data.",
  operationId: "genuiCompose",
  parameters: [{ $ref: "#/components/parameters/ApiVersionHeader" }],
  requestBody: {
    content: {
      "application/json": {
        schema: {
          properties: {
            clientRequestId: { minLength: 1, type: "string" },
            query: { maxLength: 2000, minLength: 1, type: "string" },
            version: { minimum: 1, type: "integer" },
          },
          required: ["clientRequestId", "query", "version"],
          type: "object",
        },
      },
    },
    required: true,
  },
  responses: {
    "200": {
      content: {
        "application/x-ndjson": {
          schema: { type: "object" },
        },
      },
      description: "NDJSON compose events (start, partial, complete, error)",
    },
    "400": { $ref: "#/components/responses/BadRequest" },
    "405": { $ref: "#/components/responses/MethodNotAllowed" },
    "500": { $ref: "#/components/responses/ServerError" },
  },
  summary: "GenUI compose (Ask Hunch)",
  tags: ["genui"],
};

const versioningDescription = `API versioning (v1): All documented HTTP endpoints are version 1. Prefer the X-API-Version: v1 header or the /v1/api/* path prefix (alias to /api/*). Breaking changes will ship under a new path prefix (for example /v2/api/*). Deprecated operations emit Deprecation and Sunset response headers with at least 90 days notice before removal. Assessment demo: no authentication; MCP and HTTP surfaces are fully open.`;

export const buildOpenApiDocument = (origin: string) => {
  const paths = {
    "/api/chat": { post: chatOperation },
    "/api/genui/compose": { post: genuiOperation },
    "/api/mcp": { post: mcpOperation },
    "/v1/api/chat": {
      post: { ...chatOperation, operationId: "fiAskOnlyChatV1" },
    },
    "/v1/api/genui/compose": {
      post: { ...genuiOperation, operationId: "genuiComposeV1" },
    },
    "/v1/api/mcp": {
      post: { ...mcpOperation, operationId: "mcpStreamableHttpV1" },
    },
  };

  return {
    components: openApiComponents,
    externalDocs: {
      description: "Developer portal",
      url: `${origin}/dev`,
    },
    info: {
      description: `${versioningDescription}\n\nFeature Intelligence — product feature request triage for Meta CTO assessment. Agents invoke MCP tools via POST /api/mcp (Streamable HTTP JSON-RPC). Human Ask Hunch uses POST /api/genui/compose. Tool contracts are documented as OpenAPI component schemas tagged with x-mcp-tool.`,
      title: "Feature Intelligence API",
      version: "1.0.0",
      "x-api-version": "v1",
      "x-cli": {
        install: "npx feature-intelligence-cli",
        package: "feature-intelligence-cli",
      },
      "x-deprecation-policy":
        "Deprecation and Sunset headers on affected responses; minimum 90 days before removal.",
    },
    openapi: "3.1.0",
    paths: Object.fromEntries(
      Object.entries(paths).toSorted(([a], [b]) => a.localeCompare(b))
    ),
    servers: [{ description: "Current v1 base URL", url: origin }],
    tags: [
      { description: "Streamable HTTP MCP", name: "mcp" },
      { description: "Ask Hunch GenUI NDJSON compose", name: "genui" },
      { description: "Human ask-only assistant", name: "chat" },
    ],
  };
};
