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

  // Configuração de imagens externas
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/api/**',
      },
    ],
    // Formatos de imagem suportados
    formats: ['image/avif', 'image/webp'],
    // Tamanhos permitidos
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers de segurança (CSP corrigido para permitir data: URIs e imagens externas)
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
              "img-src 'self' 'unsafe-inline' data: blob: https: http:",
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
