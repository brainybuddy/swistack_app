/** @type {import('next').NextConfig} */
const nextConfig = {
  // transpilePackages moved out of experimental in Next.js 14+
  transpilePackages: ['@swistack/shared'],
  // Enable standalone output for Docker production builds
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // API proxy rewrites (only if API URL is defined)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig