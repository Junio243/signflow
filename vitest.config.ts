import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
