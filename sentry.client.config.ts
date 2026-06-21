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
    // Object captured as promise rejection（通常来自第三方脚本/浏览器扩展，非业务代码）
    'Object captured as promise rejection',
    // Web3 钱包插件噪音（MetaMask / OKX / Wizz / Backpack 等插件冲突）
    'MetaMask extension not found',
    /Failed to connect to MetaMask/,
    /Backpack was unable to override/,
    /window\.ethereum/,
    /Cannot redefine property: wizz/,
    /pageProvider\.js/,
    /reading 'sendMessage'/,
    // Twitter/微信等 App 内置 WebView 导致的 React fiber 异常，非业务代码问题
    'Unknown root exit status.',
    /undefined is not an object \(evaluating 'a\[e\]\.call'\)/,
    /^Network Error$/,
    /^Load failed$/,
    /^Failed to fetch$/,
  ],
})
