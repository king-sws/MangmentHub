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
    experimental: {
    // Add supported experimental options here if needed
  },
  
  // You can also try this method
  output: 'standalone',
  
  // This option tells Next.js not to prerender specific paths
  unstable_excludeFiles: ['**/settings/subscription/**'],
    
};

export default nextConfig;
