import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '10.10.99.160',
  ],
  async rewrites() {
    return [
      {
        source: "/admin-api/:path*",
        destination: "https://grand-unity-production-0f12.up.railway.app/:path*",
      },
    ];
  },
};

export default nextConfig;
