import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  distDir: process.env.APP_ENV === 'test' ? '.next-e2e' : '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};

export default nextConfig;