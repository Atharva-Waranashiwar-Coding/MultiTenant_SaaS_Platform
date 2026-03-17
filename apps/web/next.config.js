/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy API calls in dev so CORS is handled simply
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/v1/:path*',
            destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/:path*`,
          },
        ]
      : [];
  },
};

module.exports = nextConfig;
