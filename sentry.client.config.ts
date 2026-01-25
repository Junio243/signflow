import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define a taxa de amostragem para performance monitoring
  tracesSampleRate: 1.0,

  // Define qual porcentagem de sessões devem ser gravadas (Session Replay)
  replaysSessionSampleRate: 0.1,

  // Taxa de gravação quando um erro ocorre
  replaysOnErrorSampleRate: 1.0,

  // Configurações do ambiente
  environment: process.env.NODE_ENV,

  // Ignora erros comuns que não precisam de rastreamento
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    /Loading chunk .* failed/,
  ],

  // Integrações
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
