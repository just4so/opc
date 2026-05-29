import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // 旧色阶（向后兼容，现有页面依赖这些 class）
        // ============================================
        primary: {
          DEFAULT: '#F97316',
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        secondary: {
          DEFAULT: '#334155',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        accent: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },

        // ============================================
        // DESIGN.md 语义 token（V2 新页面使用这些）
        // ============================================

        // 品牌色
        'primary-soft': '#FFF7ED',        // 极淡橙底

        // 文字层级
        ink: '#000000',
        'ink-soft': '#211922',
        body: '#33332e',
        charcoal: '#262622',
        mute: '#62625b',
        ash: '#91918c',
        stone: '#c8c8c1',

        // 表面层级
        canvas: '#ffffff',
        'surface-soft': '#fbfbf9',
        'surface-card': '#f6f6f3',
        'surface-elevated': '#ffffff',
        'surface-dark': '#262622',

        // shadcn 组件兼容
        popover: '#ffffff',
        'popover-foreground': '#262622',

        // 分割线
        hairline: '#dadad3',
        'hairline-soft': '#e5e5e0',

        // 交互色
        'secondary-bg': '#e5e5e0',
        'secondary-pressed': '#c8c8c1',
        'on-primary': '#ffffff',
        'on-secondary': '#000000',
        'on-dark': '#ffffff',
        'on-dark-mute': 'rgba(255,255,255,0.7)',

        // 功能色
        'focus-outer': '#435ee5',
        'focus-inner': '#ffffff',
        'ds-success': '#103c25',
        'ds-success-bg': '#c7f0da',
        'ds-error': '#9e0a0a',
        'ds-error-bg': '#FEE2E2',
        'ds-warning': '#EA580C',
        'ds-info': '#435ee5',

        // 状态徽章色
        'badge-pending': '#FEF3C7',
        'badge-pending-text': '#92400E',
        'badge-contacted': '#DBEAFE',
        'badge-contacted-text': '#1E40AF',
        'badge-done': '#D1FAE5',
        'badge-done-text': '#065F46',
        'badge-cancelled': '#F3F4F6',
        'badge-cancelled-text': '#6B7280',

        // 背景色（统一到 DESIGN.md）
        background: '#fbfbf9',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)',
        'floating-cta': '0 4px 12px rgba(249,115,22,0.3)',
      },
      borderRadius: {
        // 旧值（向后兼容）
        'xl': '0.875rem',
        '2xl': '1rem',
        // DESIGN.md 语义值
        'ds-sm': '8px',
        'ds-md': '16px',
        'ds-lg': '32px',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('tailwindcss-animate')],
}

export default config
