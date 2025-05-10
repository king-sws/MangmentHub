import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['lh3.googleusercontent.com', "ui-avatars.com" ], // Add Google's image server
  },
  typescript: {
    ignoreBuildErrors: true,
  },
      eslint: {
        ignoreDuringBuilds: true,
      },
    
};

export default nextConfig;
