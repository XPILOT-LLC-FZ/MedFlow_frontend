import type { NextConfig } from "next";

function normalizeBackendOrigin(rawUrl: string | undefined): string {
  const fallback = "http://localhost:3001";
  const trimmed = rawUrl?.trim() || fallback;
  return trimmed.replace(/\/+$/, "").replace(/\/api$/, "");
}

const backendOrigin = normalizeBackendOrigin(
  process.env.BACKEND_URL,
);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
