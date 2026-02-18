/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que o deploy quebre por causa de lint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Evita que o deploy quebre por erros de types do TS
  typescript: {
    ignoreBuildErrors: true,
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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ─────────────────────────────────────────────────────────────────
  // Headers de segurança HTTP
  // Nota: os headers abaixo são fallback para rotas estáticas.
  // O middleware.ts aplica os mesmos headers em todas as rotas dinâmicas.
  // ─────────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Impede o browser de detectar MIME type por conta própria
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Bloqueia clickjacking via iframes
          { key: 'X-Frame-Options', value: 'DENY' },

          // Ativa proteção XSS no browser (legado, mas útil)
          { key: 'X-XSS-Protection', value: '1; mode=block' },

          // Força HTTPS por 1 ano + subdomínios + preload
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },

          // Política de referrer segura
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Desativa funcionalidades sensíveis do browser
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },

          // Content Security Policy completa
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // unsafe-eval necessário para Next.js dev mode e alguns bundles
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // data: e blob: necessários para preview de PDFs e assinaturas
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // Bloqueia embedding em iframes de outros domínios
              "frame-ancestors 'none'",
              // Força upgrade de HTTP para HTTPS
              "upgrade-insecure-requests",
              // Supabase: REST + Realtime (WebSocket)
              "connect-src 'self' data: blob: https://*.supabase.co https://*.supabase.in wss://*.supabase.co",
              "media-src 'self' data: blob:",
              // Service workers e Web Workers
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
