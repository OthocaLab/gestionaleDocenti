/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
    
    // Configure allowed dev origins for cross-origin requests
    allowedDevOrigins: process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS 
      ? process.env.NEXT_PUBLIC_ALLOWED_DEV_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'localhost:3000',
          '127.0.0.1:3000',
          'gestionaledocenti.ddns.net',
          '3.121.230.179',
          '172.26.10.221:3000',
          '3.121.230.179:3000'
        ],
    
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_DESTINATION || 'http://localhost:5000/api'}/:path*`,
        },
      ];
    },
    
    // Add headers for better CORS handling
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          ]
        }
      ]
    }
  }
  
  module.exports = nextConfig;