import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/_nhost/auth/:path*",
        destination: "https://local.auth.local.nhost.run:8443/v1/:path*",
      },
      {
        source: "/_nhost/graphql/:path*",
        destination: "https://local.graphql.local.nhost.run:8443/v1/:path*",
      },
      {
        source: "/_nhost/storage/:path*",
        destination: "https://local.storage.local.nhost.run:8443/v1/:path*",
      },
      {
        source: "/_nhost/functions/:path*",
        destination: "https://local.functions.local.nhost.run:8443/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
