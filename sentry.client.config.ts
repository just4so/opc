import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 采样率：生产环境只采 10% 的性能 trace，错误全量上报
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 只在生产环境启用，本地开发不上报
  enabled: process.env.NODE_ENV === 'production',

  // 忽略常见的无意义前端错误
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    /^Network Error$/,
    /^Load failed$/,
    /^Failed to fetch$/,
  ],
})
