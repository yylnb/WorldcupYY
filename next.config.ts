import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/football",
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb"
    }
  }
};

export default nextConfig;
