import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["flow.localhost", "*.flow.localhost"],
  transpilePackages: ["@repo/genui", "@repo/ui"],
};

export default nextConfig;
