import { withEve } from "eve/next";
import type { NextConfig } from "next";

/** Markdown negotiation when Accept asks for markdown and does not list text/html. */
const markdownAcceptPattern = "^(?!.*text/html).*text/markdown";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["app.localhost", "*.app.localhost"],
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
    "/api/mcp": ["./mcp-app/dist/genui-preview.html"],
    "/mcp": ["./mcp-app/dist/genui-preview.html"],
  },
  redirects() {
    return [{ destination: "/dev", permanent: false, source: "/developers" }];
  },
  rewrites() {
    return {
      beforeFiles: [
        {
          destination: "/api/:path*",
          source: "/v1/api/:path*",
        },
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
  transpilePackages: ["@repo/db", "@repo/genui", "@repo/ui"],
};

export default withEve(nextConfig, { eveRoot: "../.." });
