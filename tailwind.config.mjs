/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D5A27',
          50: '#E8F5E6',
          100: '#C6E6C0',
          200: '#A3D89A',
          300: '#80CA74',
          400: '#5DBC4E',
          500: '#2D5A27',
          600: '#244B20',
          700: '#1B3C19',
          800: '#122D12',
          900: '#091E0B',
        },
        secondary: {
          DEFAULT: '#8B7355',
          light: '#A89279',
          dark: '#6B5740',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1C1917',
        },
        background: {
          DEFAULT: '#FEFDFB',
          dark: '#0C0A09',
        },
        text: {
          DEFAULT: '#1C1917',
          muted: '#78716C',
          dark: '#FAFAF9',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
        ],
        mono: ['"SF Mono"', '"Fira Code"', '"Fira Mono"', 'Menlo', 'monospace'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.625',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'lg': '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05)',
      },
      transitionDuration: {
        'DEFAULT': '300ms',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
