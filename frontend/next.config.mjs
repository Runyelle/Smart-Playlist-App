/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow cross-origin requests from 127.0.0.1 in development
  // This fixes the warning about accessing Next.js dev server from 127.0.0.1
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
}

export default nextConfig
