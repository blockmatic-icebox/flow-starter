import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["meta-cto.localhost", "*.meta-cto.localhost"],
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
