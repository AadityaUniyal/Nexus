import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei", "motion"],
  serverExternalPackages: ["@prisma/client"],
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
