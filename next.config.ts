import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Exclude problematic packages from bundling
  serverExternalPackages: [
    'pino',
    'thread-stream',
    '@walletconnect/logger',
  ],

  // Empty turbopack config to allow webpack config in dev mode
  turbopack: {},

  webpack: (config, { isServer }) => {
    // Mark test dependencies as external to prevent bundling test files
    if (!config.externals) {
      config.externals = [];
    }

    if (Array.isArray(config.externals)) {
      config.externals.push({
        'tap': 'tap',
        'why-is-node-running': 'why-is-node-running',
      });
    }

    // Fallback for node modules in client-side
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = config.resolve.fallback || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
