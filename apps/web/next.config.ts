import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["web.localhost", "*.web.localhost"],
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
