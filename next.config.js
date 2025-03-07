/** @type {import('next').NextConfig} */
const nextConfig = {
  // Quita la opción 'serverActions' que no es reconocida
  // o reemplázala por opciones válidas
  
  // Ejemplo de configuración válida:
  reactStrictMode: true,
  // experimental: {
  //   serverActions: true, // Si quieres habilitar server actions, usar en experimental
  // },
};

module.exports = nextConfig;
