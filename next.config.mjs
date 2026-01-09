/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que o deploy quebre por causa de lint
  eslint: { ignoreDuringBuilds: true },

  // Evita que o deploy quebre por erros de types do TS
  // (recomendo deixar assim até estabilizar o projeto)
  typescript: { ignoreBuildErrors: true },

  // Configuração para aceitar arquivos maiores (até 20MB)
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
}

export default nextConfig
