export const mcpStreamableHeaders = {
  accept: "application/json, text/event-stream",
  "content-type": "application/json",
} as const;

export const mcpJsonRpcRequest = ({
  body,
  handler,
  url = "https://flow.test/api/mcp",
}: {
  body: Record<string, unknown>;
  handler: (request: Request) => Promise<Response>;
  url?: string;
}) =>
  handler(
    new Request(url, {
      body: JSON.stringify(body),
      headers: mcpStreamableHeaders,
      method: "POST",
    })
  );

const jsonRpcPayloadFromBody = (body: string) => {
  const trimmed = body.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as {
      error?: { code: number; message: string };
      result?: unknown;
    };
  }
  const dataLines = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
  const last = dataLines.at(-1);
  if (!last) {
    throw new Error("MCP response missing JSON-RPC payload");
  }
  return JSON.parse(last) as {
    error?: { code: number; message: string };
    result?: unknown;
  };
};

export const mcpJsonRpcResult = async <T>(response: Response) => {
  const payload = jsonRpcPayloadFromBody(await response.text());
  return payload as {
    error?: { code: number; message: string };
    result?: T;
  };
};
