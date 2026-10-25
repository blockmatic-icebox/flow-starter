import { withEve } from "eve/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["meta-cto.localhost", "*.meta-cto.localhost"],
  experimental: {
    extensionAlias: {
      ".js": [".ts", ".tsx", ".js"],
    },
  },
  transpilePackages: ["@repo/db", "@repo/fi", "@repo/ui"],
};

export default withEve(nextConfig, { eveRoot: "../.." });
