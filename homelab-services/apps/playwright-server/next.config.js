/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: [
    '@homelab/ui',
    '@homelab/api',
    '@homelab/db',
    '@homelab/validators',
    '@homelab/report-parser',
    '@homelab/failure-classifier',
    '@homelab/claude-integration',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['chokidar', 'better-sqlite3'],
  },
}

module.exports = nextConfig
