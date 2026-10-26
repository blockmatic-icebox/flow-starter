import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/server";
import {
  confirmRequest,
  createDraftAndTriage,
  DispositionError,
  featureRequestSourceSchema,
  getInsights,
  getRequest,
  listTriageQueue,
  searchRequests,
  setDisposition,
  supportRequest,
  getDb,
} from "@repo/fi";
import { z } from "zod";

import { HUNCH_EXPLORER_RESOURCE_URI } from "./hunch-explorer-resource";
import { asToolResult } from "./tool-result";

const db = () => getDb();

const explorerToolMeta = {
  _meta: { ui: { resourceUri: HUNCH_EXPLORER_RESOURCE_URI } },
};

export const registerFiMcpTools = (server: McpServer) => {
  registerAppTool(
    server,
    "search_requests",
    {
      description:
        "Search published feature requests by text and optional theme key.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(50).optional(),
        query: z.string().optional(),
        themeKey: z.string().optional(),
      }),
      ...explorerToolMeta,
    },
    async ({ limit, query, themeKey }) => {
      const result = await searchRequests({
        db: db(),
        pageSize: limit ?? 25,
        query,
        themeKey,
      });
      return asToolResult({
        count: result.items.length,
        page: result.page,
        requests: result.items.map((r) => ({
          id: r.id,
          source: r.source,
          supportCount: r.supportCount,
          themeKey: r.themeKey,
          title: r.title,
        })),
      });
    }
  );

  registerAppTool(
    server,
    "get_request",
    {
      description:
        "Get a feature request by id with duplicates and support count.",
      inputSchema: z.object({ requestId: z.string().uuid() }),
      ...explorerToolMeta,
    },
    async ({ requestId }) => {
      const detail = await getRequest({ db: db(), requestId });
      if (!detail) return asToolResult({ found: false });
      return asToolResult({
        found: true,
        request: detail.request,
        supportCount: detail.supportCount,
      });
    }
  );

  registerAppTool(
    server,
    "list_triage_queue",
    {
      description: "List published requests awaiting PM disposition.",
      inputSchema: z.object({}),
      ...explorerToolMeta,
    },
    async () => {
      const rows = await listTriageQueue({ db: db() });
      return asToolResult({
        count: rows.length,
        requests: rows.map((r) => ({
          decisionBrief: r.decisionBrief,
          id: r.id,
          themeKey: r.themeKey,
          title: r.title,
        })),
      });
    }
  );

  registerAppTool(
    server,
    "get_insights",
    {
      description: "North-star product metrics for feature intelligence.",
      inputSchema: z.object({
        range: z.enum(["7d", "30d", "90d", "all"]).optional(),
      }),
      ...explorerToolMeta,
    },
    async ({ range }) => asToolResult(await getInsights({ db: db(), range }))
  );

  registerAppTool(
    server,
    "submit_request",
    {
      description:
        "Create a draft feature request and run the AI triage harness. Returns pending_confirm preview only—call confirm_request after user approval.",
      inputSchema: z.object({
        description: z.string().min(1).max(8000),
        source: featureRequestSourceSchema,
        title: z.string().min(1).max(500),
      }),
      ...explorerToolMeta,
    },
    async ({ description, source, title }) =>
      asToolResult(
        await (async () => {
          const { harness, request } = await createDraftAndTriage({
            db: db(),
            description,
            source,
            title,
          });
          return { harness, request, status: "pending_confirm" };
        })()
      )
  );

  server.registerTool(
    "confirm_request",
    {
      description:
        "Publish a draft request after the user confirms or edits the problem statement.",
      inputSchema: z.object({
        intakeLinkedRequestId: z.string().uuid().nullable().optional(),
        problemStatement: z.string().min(1).max(4000),
        requestId: z.string().uuid(),
      }),
    },
    async ({ intakeLinkedRequestId, problemStatement, requestId }) =>
      asToolResult({
        request: await confirmRequest({
          db: db(),
          intakeLinkedRequestId,
          problemStatement,
          requestId,
        }),
      })
  );

  server.registerTool(
    "support_request",
    {
      description: "Add support for a published feature request.",
      inputSchema: z.object({
        requestId: z.string().uuid(),
        supporterKey: z.string().min(1).max(200),
      }),
    },
    async ({ requestId, supporterKey }) =>
      asToolResult(await supportRequest({ db: db(), requestId, supporterKey }))
  );

  server.registerTool(
    "set_disposition",
    {
      description: "Set PM disposition on a published feature request.",
      inputSchema: z.object({
        disposition: z.enum([
          "merge",
          "monitor",
          "decline",
          "needs_discussion",
        ]),
        dispositionRationale: z.string().min(1),
        mergeTargetId: z.string().uuid().optional(),
        requestId: z.string().uuid(),
      }),
    },
    async ({ disposition, dispositionRationale, mergeTargetId, requestId }) => {
      try {
        return asToolResult(
          await setDisposition({
            db: db(),
            disposition,
            dispositionRationale,
            mergeTargetId,
            requestId,
          })
        );
      } catch (error) {
        if (error instanceof DispositionError)
          throw new Error(`${error.code}: ${error.message}`, { cause: error });
        throw error;
      }
    }
  );
};
