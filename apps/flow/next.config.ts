import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["flow.localhost", "*.flow.localhost"],
  rewrites() {
    return [
      {
        destination: "/genui-lab/fixtures/:fixtureId",
        source: "/__genui__/fixtures/:fixtureId",
      },
    ];
  },
  transpilePackages: ["@repo/genui", "@repo/ui"],
};

export default nextConfig;
