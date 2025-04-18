/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Aplica CORS a todas las rutas
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  experimental: {
    // Desactivar el strict mode para las API Routes
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['*']
    },
  },
  serverExternalPackages: ['mongoose'],
  images: {
    domains: ['example.com', 'otrodomain.com'],
  },
  eslint: {
    // Ignorar ESLint durante la compilación
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar TypeScript durante la compilación
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
