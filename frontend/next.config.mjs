/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for production builds
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // Disable image optimization for static export
  images: {
    unoptimized: process.env.NODE_ENV === 'production' ? true : false,
  },

  // For development, use rewrites to proxy API requests
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
