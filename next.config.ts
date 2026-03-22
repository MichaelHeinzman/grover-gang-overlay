import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Ensure all packages share the same React instance (prevents
    // duplicate-context issues with file-linked local packages)
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve("node_modules/react"),
      "react-dom": path.resolve("node_modules/react-dom"),
    };
    return config;
  },
};

export default nextConfig;
