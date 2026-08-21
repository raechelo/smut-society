import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Outcome image uploads (up to 5 MB) are sent through a Server Action,
      // which otherwise caps request bodies at 1 MB.
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
