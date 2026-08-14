import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8881",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8881",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;