import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', "ui-avatars.com", "images.remotePatterns"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // You can add supported experimental options here
    
  },
  output: 'standalone',
};

export default nextConfig;
