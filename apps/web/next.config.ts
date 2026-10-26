import { withEve } from "eve/next";
import type { NextConfig } from "next";

/** Markdown negotiation when Accept asks for markdown and does not list text/html. */
const markdownAcceptPattern = "^(?!.*text/html).*text/markdown";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["meta-cto.localhost", "*.meta-cto.localhost"],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
  headers() {
    return [
      {
        headers: [{ key: "Vary", value: "Accept" }],
        source: "/",
      },
    ];
  },
  outputFileTracingIncludes: {
    "/api/mcp": ["./mcp-app/dist/hunch-explorer.html"],
    "/mcp": ["./mcp-app/dist/hunch-explorer.html"],
  },
  redirects() {
    return [
      { destination: "/signals", permanent: false, source: "/requests" },
      {
        destination: "/signals/:path*",
        permanent: false,
        source: "/requests/:path*",
      },
      {
        destination: "/feedback/new",
        permanent: false,
        source: "/requests/new",
      },
      { destination: "/review", permanent: false, source: "/triage" },
      { destination: "/patterns", permanent: false, source: "/insights" },
      { destination: "/ask", permanent: false, source: "/chat" },
    ];
  },
  rewrites() {
    return {
      beforeFiles: [
        {
          destination: "/markdown/home",
          source: "/index.md",
        },
        {
          destination: "/markdown/home",
          has: [
            {
              key: "accept",
              type: "header",
              value: markdownAcceptPattern,
            },
          ],
          source: "/",
        },
      ],
    };
  },
  transpilePackages: ["@repo/db", "@repo/fi", "@repo/genui", "@repo/ui"],
};

export default withEve(nextConfig, { eveRoot: "../.." });
