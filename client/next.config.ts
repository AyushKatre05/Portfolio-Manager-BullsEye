import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Compress assets
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Image optimization
  images: {
    unoptimized: false,
    remotePatterns: [],
  },
};

export default nextConfig;
