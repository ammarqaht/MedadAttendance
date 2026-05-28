import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif']
      },
      colors: {
        cream: {
          DEFAULT: '#FAFAF7',
          50: '#FDFCFA',
          100: '#F8F5EF',
          200: '#F2EDE3',
          300: '#E8E1D2'
        },
        ink: {
          900: '#1A1A1A',
          800: '#2D2D2D',
          700: '#3F3F3F',
          500: '#6B6B6B',
          400: '#8A8A8A',
          300: '#B5B0A7',
          200: '#E8E4DF'
        },
        gold: {
          DEFAULT: '#B8860B',
          400: '#C9A84C',
          500: '#B8860B',
          600: '#9A7109',
          50:  '#FBF5E6'
        },
        sage: {
          DEFAULT: '#7C9082',
          600: '#5A7A5A',
          400: '#9DB5A1',
          50:  '#EEF3EF'
        },
        rose: {
          muted: '#C0616B',
          50:    '#F8ECEE'
        }
      },
      boxShadow: {
        soft: '0 2px 12px rgba(45, 35, 20, 0.06)',
        elevated: '0 8px 32px rgba(45, 35, 20, 0.08)',
        gold: '0 0 0 1px rgba(184, 134, 11, 0.18), 0 2px 12px rgba(184, 134, 11, 0.08)'
      },
      borderRadius: { xl2: '14px' },
      transitionTimingFunction: { gentle: 'cubic-bezier(0.4, 0, 0.2, 1)' }
    }
  },
  plugins: []
};

export default config;
