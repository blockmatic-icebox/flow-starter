import { withEve } from "eve/next";
import type { NextConfig } from "next";

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
  rewrites() {
    return {
      beforeFiles: [
        {
          destination: "/markdown/home",
          has: [
            {
              key: "accept",
              type: "header",
              value: ".*text/markdown.*",
            },
          ],
          source: "/",
        },
      ],
    };
  },
  transpilePackages: ["@repo/db", "@repo/fi", "@repo/ui"],
};

export default withEve(nextConfig, { eveRoot: "../.." });
