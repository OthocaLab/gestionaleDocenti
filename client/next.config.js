/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
    allowedDevOrigins: process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS 
      ? process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'localhost:3000',
          '127.0.0.1:3000',
          'gestionaledocenti.ddns.net',
          '3.121.230.179',
          '172.26.10.221:3000'
        ],
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_DESTINATION || 'http://localhost:5000/api'}/:path*`,
        },
      ];
    } 
  }
  
  module.exports = nextConfig;