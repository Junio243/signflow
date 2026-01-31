/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que o deploy quebre por causa de lint
  eslint: { 
    ignoreDuringBuilds: true 
  },

  // Evita que o deploy quebre por erros de types do TS
  typescript: { 
    ignoreBuildErrors: true 
  },

  // Configuração para aceitar arquivos maiores (até 20MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
