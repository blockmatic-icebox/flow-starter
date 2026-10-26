#!/usr/bin/env node

const host =
  process.env.AGENTIC_CHECK_URL?.replace(/^https?:\/\//u, "") ??
  process.argv
    .find((arg) => !arg.startsWith("-") && arg !== process.argv[1])
    ?.replace(/^https?:\/\//u, "") ??
  "meta-cto-two.vercel.app";

const origin = `https://${host.replace(/\/$/u, "")}`;

const mcpHeaders = {
  Accept: "application/json, text/event-stream",
  "Content-Type": "application/json",
};

const mcpPost = async (body) => {
  const res = await fetch(`${origin}/api/mcp`, {
    body: JSON.stringify(body),
    headers: mcpHeaders,
    method: "POST",
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { json, ok: res.ok, status: res.status, text };
};

const help = () => {
  process.stdout.write(`Feature Intelligence CLI (assessment demo)

Usage:
  fi [host-without-scheme]
  AGENTIC_CHECK_URL=<host> fi

Commands:
  fi              Print API links for the configured host
  fi --openapi    Fetch and validate /openapi.json exists
  fi --mcp-smoke  MCP initialize + tools/list against configured host

Links:
  Developers   ${origin}/developers
  OpenAPI      ${origin}/openapi.json
  MCP          ${origin}/api/mcp
  llms.txt     ${origin}/llms.txt

Install: pnpm --filter @repo/fi-cli exec fi
`);
};

const runMcpSmoke = async () => {
  const init = await mcpPost({
    id: 1,
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      capabilities: {},
      clientInfo: { name: "fi-cli", version: "1.0.0" },
      protocolVersion: "2025-03-26",
    },
  });
  if (!init.ok) {
    process.stderr.write(
      `MCP initialize failed: ${init.status}\n${init.text}\n`
    );
    process.exitCode = 1;
    return;
  }
  const serverName = init.json?.result?.serverInfo?.name;
  if (serverName !== "feature-intelligence") {
    process.stderr.write(
      `Unexpected serverInfo.name: ${serverName ?? "missing"}\n`
    );
    process.exitCode = 1;
    return;
  }

  const list = await mcpPost({
    id: 2,
    jsonrpc: "2.0",
    method: "tools/list",
    params: {},
  });
  if (!list.ok) {
    process.stderr.write(
      `MCP tools/list failed: ${list.status}\n${list.text}\n`
    );
    process.exitCode = 1;
    return;
  }
  const toolCount = list.json?.result?.tools?.length ?? 0;
  if (toolCount < 8) {
    process.stderr.write(`Expected at least 8 tools, got ${toolCount}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    `MCP OK — ${origin}/api/mcp (${serverName}, ${toolCount} tools)\n`
  );
};

const main = async () => {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    help();
    return;
  }
  if (process.argv.includes("--mcp-smoke")) {
    await runMcpSmoke();
    return;
  }
  if (process.argv.includes("--openapi")) {
    const res = await fetch(`${origin}/openapi.json`);
    if (!res.ok) {
      process.stderr.write(`openapi fetch failed: ${res.status}\n`);
      process.exitCode = 1;
      return;
    }
    const doc = await res.json();
    process.stdout.write(
      `${doc.info?.title ?? "API"} v${doc.info?.version ?? "?"} — ${Object.keys(doc.paths ?? {}).length} paths\n`
    );
    return;
  }
  help();
};

try {
  await main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
  process.exitCode = 1;
}
