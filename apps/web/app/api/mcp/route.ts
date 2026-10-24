import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextResponse } from "next/server";

import { admitChat } from "@/lib/consultant/admit-chat";
import { createConsultantMcpServer } from "@/lib/consultant/mcp-server";
import { memoryCapStore } from "@/lib/genui/cap-store";
import {
  composeRateLimitEnforced,
  isLocalDevHost,
  readRequestIp,
  requestHost,
} from "@/lib/genui/request";

export const runtime = "nodejs";

const capStore = memoryCapStore();

const authorizeMcp = (request: Request) => {
  const host = requestHost(request);
  if (isLocalDevHost(host)) return true;
  const expected = process.env.CONSULTANT_MCP_BEARER?.trim();
  if (!expected) return true;
  const header = request.headers.get("authorization")?.trim();
  return header === `Bearer ${expected}`;
};

const handleMcp = async (request: Request) => {
  if (!authorizeMcp(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const ip = readRequestIp(request);
  const host = requestHost(request);
  const admitted = await admitChat({
    enforce: composeRateLimitEnforced({ host }),
    ip,
    now: new Date(),
    store: capStore,
  });
  if (!admitted.ok) {
    return NextResponse.json({ message: admitted.message }, { status: 429 });
  }

  const server = createConsultantMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return transport.handleRequest(request);
};

export const GET = handleMcp;
export const POST = handleMcp;
export const DELETE = handleMcp;
