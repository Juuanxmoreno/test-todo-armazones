import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://localhost:3000"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api.juancruzmoreno.dev",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "todoarmazonesarg.com",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "todoarmazonesarg.com",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
