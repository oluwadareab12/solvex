/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack(config) {
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    // Suppress dynamic require() warning from snarkjs/ffjavascript web-worker
    config.ignoreWarnings = [
      { module: /web-worker/ },
      { message: /Critical dependency/ },
    ];
    return config;
  },
};

export default nextConfig;
