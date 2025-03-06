/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true // Debe ser true, no un booleano directo
  }
};

module.exports = nextConfig;
