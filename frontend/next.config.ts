import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // snarkjs uses Node built-ins; suppress them in the browser bundle
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

export default nextConfig;
