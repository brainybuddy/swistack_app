/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  images: {
    domains: ['localhost', 'images.unsplash.com', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ]
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'demo-key',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || '3000'}`,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'demo-secret',
    DATABASE_URL: process.env.DATABASE_URL || 'sqlite://./demo.db',
    FRONTEND_PORT: process.env.PORT || '3000',
    BACKEND_PORT: process.env.BACKEND_PORT || '3001'
  }
}

module.exports = nextConfig
