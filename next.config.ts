import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  allowedDevOrigins: ['192.168.1.104'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
