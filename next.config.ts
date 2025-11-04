import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    serverMinification: false,
  },
};

export default nextConfig;
