import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei", "motion"],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: api.geoapify.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://img.clerk.com",
              "connect-src 'self' api.geoapify.com *.vercel.app *.vercel-insights.com *.azurewebsites.net https://nexus-api-prod-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net wss: https://nexus-backend.onrender.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com",
              "font-src 'self' data:",
              "frame-src 'self' https://vercel.live https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com",
              "worker-src 'self' blob:",
            ].join("; "),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(self)',
          },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
