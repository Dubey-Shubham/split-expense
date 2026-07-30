import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cacheComponents: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
