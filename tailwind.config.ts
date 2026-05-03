import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0faf4',
          100: '#dcf4e5',
          200: '#bbe8cd',
          300: '#88d5ab',
          400: '#4eba7e',
          500: '#2a9d5c',
          600: '#1B6B3A',   // main brand green
          700: '#175a31',
          800: '#154928',
          900: '#123c22',
        },
        secondary: {
          50:  '#fff9eb',
          100: '#fef0c7',
          200: '#fde08a',
          300: '#fbc94d',
          400: '#F4A300',   // main brand gold
          500: '#e08c00',
          600: '#c47000',
          700: '#9c5400',
        },
        cream: '#FAFAF5',
      },
      fontFamily: {
        sans:     ['var(--font-inter)', 'sans-serif'],
        malayalam:['var(--font-noto-malayalam)', 'sans-serif'],
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease-out both',
        'fade-in':   'fadeIn 0.5s ease-out both',
        'count-up':  'countUp 1.5s ease-out both',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [],
};

export default config;
