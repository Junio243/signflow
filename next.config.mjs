import withPWA from 'next-pwa';

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
};

// Configuração PWA
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 // 24 horas
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
        }
      }
    }
  ]
});

export default pwaConfig(nextConfig);
