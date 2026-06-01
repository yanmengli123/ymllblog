/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['Inconsolata', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
      },
      colors: {
        // Matery 主题色系
        primary: {
          DEFAULT: '#0f9d58',
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#0f9d58',
          600: '#0d8a4e',
          700: '#0b7744',
          800: '#09643a',
          900: '#075130',
        },
        accent: {
          DEFAULT: '#42b983',
          light: '#5bc69b',
          dark: '#35a06e',
        },
        matery: {
          purple: '#bf30ac',
          green: '#0f9d58',
          vue: '#42b983',
          body: '#eaeaea',
          text: '#34495e',
          secondary: '#525f7f',
          muted: '#777',
        },
      },
      boxShadow: {
        // Matery 卡片阴影
        'card': '0 15px 35px rgba(50, 50, 93, .1), 0 5px 15px rgba(0, 0, 0, .07)',
        'card-hover': '0 18px 40px rgba(50, 50, 93, .15), 0 8px 20px rgba(0, 0, 0, .1)',
        'nav': '0 2px 5px 0 rgba(0,0,0,.16), 0 2px 10px 0 rgba(0,0,0,.12)',
        'fab': '0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12), 0 3px 5px -1px rgba(0,0,0,.2)',
      },
      borderRadius: {
        'card': '10px',
        'chip': '15px',
        'btn': '30px',
        'avatar': '50%',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.6s ease-out forwards',
        'zoom-in': 'zoomIn 0.6s ease-out forwards',
        'rainbow': 'rainbow 15s ease infinite',
        'glow': 'glowing-caution 1.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        rainbow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        glowing: {
          '0%': { boxShadow: '0 0 3px rgba(255, 67, 81, 0.5), 0 0 6px rgba(255, 67, 81, 0.3)' },
          '50%': { boxShadow: '0 0 10px rgba(255, 67, 81, 0.8), 0 0 20px rgba(255, 67, 81, 0.5)' },
          '100%': { boxShadow: '0 0 3px rgba(255, 67, 81, 0.5), 0 0 6px rgba(255, 67, 81, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        // Matery 渐变
        'matery-gradient': 'linear-gradient(to right, #bf30ac 0%, #0f9d58 100%)',
        'matery-gradient-reverse': 'linear-gradient(to right, #0f9d58 0%, #bf30ac 100%)',
        'btn-gradient': 'linear-gradient(to bottom right, #FF5E3A 0%, #FF2A68 100%)',
        'tag-active': 'linear-gradient(to bottom right, #FF5E3A 0%, #FF2A68 100%)',
        'tag-hover': 'linear-gradient(to bottom right, #4cbf30 0%, #0f9d58 100%)',
      },
    },
  },
  plugins: [],
}
