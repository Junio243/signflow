import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Taxa de amostragem para performance monitoring
  tracesSampleRate: 1.0,

  // Configurações do ambiente
  environment: process.env.NODE_ENV,

  // Ignora erros comuns do servidor
  ignoreErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
  ],
});
