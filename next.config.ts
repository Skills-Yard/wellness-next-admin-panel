import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async redirects() {
    return [
      {
        source: '/User',
        destination: '/users',
        permanent: true,
      },
      {
        source: '/User/:id*',
        destination: '/users/:id*',
        permanent: true,
      },
      {
        source: '/user',
        destination: '/users',
        permanent: true,
      },
      {
        source: '/user/:id*',
        destination: '/users/:id*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
