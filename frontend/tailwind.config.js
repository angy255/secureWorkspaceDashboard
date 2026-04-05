/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#f3f6f0',
          100: '#e4ebe0',
          200: '#c7d6c0',
          300: '#a8bc9f',
          400: '#8fa882',
          500: '#8a9a7b',
          600: '#7a8a6b',
          700: '#697a5c',
          800: '#566249',
          900: '#434e38',
        },
        cadet: {
          50:  '#eef3f5',
          100: '#d9e4e9',
          200: '#b1c8d4',
          300: '#89abbd',
          400: '#6f95a8',
          500: '#5f7a8a',
          600: '#516a78',
          700: '#435866',
          800: '#364754',
          900: '#293744',
        },
        charcoal:      '#2d3142',
        midnight:      '#121420',
        pewter:        '#8b8f94',
        'soft-white':  '#f8f7f4',
        'light-gray':  '#d5d8dc',
        'purple-taupe': '#50404d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'in': 'fadeIn 150ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
