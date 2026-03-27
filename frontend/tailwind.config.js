/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#141414',
        'surface-variant': '#353534',
        primary: '#05ace5',
        secondary: '#547c93',
        tertiary: '#e38d22',
        muted: '#888888',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
      },
    },
  },
  plugins: [],
}
