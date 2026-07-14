import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kf/core", "@kf/db", "@kf/ai", "@kf/pka", "@kf/ui", "@kf/config"]
};

export default nextConfig;
