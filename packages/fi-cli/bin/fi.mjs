#!/usr/bin/env node

const host =
  process.env.AGENTIC_CHECK_URL?.replace(/^https?:\/\//u, "") ??
  process.argv[2]?.replace(/^https?:\/\//u, "") ??
  "meta-cto-two.vercel.app";

const origin = `https://${host.replace(/\/$/u, "")}`;

const help = () => {
  process.stdout.write(`Feature Intelligence CLI (assessment demo)

Usage:
  fi [host-without-scheme]
  AGENTIC_CHECK_URL=<host> fi

Commands:
  fi              Print API links for the configured host
  fi --openapi    Fetch and validate /openapi.json exists

Links:
  Developers   ${origin}/developers
  OpenAPI      ${origin}/openapi.json
  MCP          ${origin}/api/mcp
  llms.txt     ${origin}/llms.txt

Install: pnpm --filter @repo/fi-cli exec fi
`);
};

const main = async () => {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    help();
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
