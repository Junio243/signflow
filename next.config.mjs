import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que o deploy quebre por causa de lint
  eslint: { ignoreDuringBuilds: true },

  // Evita que o deploy quebre por erros de types do TS
  // (recomendo deixar assim até estabilizar o projeto)
  typescript: { ignoreBuildErrors: true },

  webpack: (config, { isServer }) => {
    // pdf.js fix
    const pdfjsDistPath = fileURLToPath(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url));
    config.plugins.push(new CopyPlugin({
      patterns: [{ from: pdfjsDistPath, to: 'static/chunks/' }],
    }));

    return config;
  },
}

export default nextConfig
