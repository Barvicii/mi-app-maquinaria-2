/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add any specific configurations you need
  experimental: {
    // Enable if you want to use Server Actions
    serverActions: true,
  }
};

module.exports = nextConfig;
