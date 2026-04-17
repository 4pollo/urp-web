import type { NextConfig } from 'next';

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: isDevelopment ? '.next-dev' : '.next-build',
};

export default nextConfig;
