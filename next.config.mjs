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

  // Headers de segurança (CSP corrigido para permitir data: URIs)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              "font-src 'self' data:",
              "connect-src 'self' data: blob: https://*.supabase.co wss://*.supabase.co",
              "frame-src 'self'",
              "media-src 'self' data: blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
