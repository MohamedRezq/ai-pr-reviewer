import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '512kb',
    },
  },
  // Streaming responses require this to be disabled
  compress: false,
}

export default nextConfig

