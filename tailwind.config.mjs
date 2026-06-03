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
        // dlog.com.cn 紫色主题
        primary: {
          DEFAULT: '#8163bd',
          50: '#f3f0f9',
          100: '#e9e4f0',
          200: '#d4c9e2',
          300: '#b8a5d0',
          400: '#9c82be',
          500: '#8163bd',
          600: '#6b4fa8',
          700: '#553d87',
          800: '#3f2d66',
          900: '#2a1d45',
        },
        accent: {
          DEFAULT: '#79589f',
          light: '#9c82be',
          dark: '#6b4fa8',
        },
        matery: {
          purple: '#8163bd',
          green: '#0f9d58',
          vue: '#42b983',
          body: '#f7f7fb',
          text: '#333333',
          secondary: '#777',
          muted: '#999',
          title: '#6c549c',
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
