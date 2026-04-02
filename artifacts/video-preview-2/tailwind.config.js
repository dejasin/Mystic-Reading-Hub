/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oracle: {
          bg: '#04040f',
          surface: '#0b0b1e',
          gold: '#c9a84c',
          goldLight: '#e8cc7a',
          cream: '#f0e6cc',
          muted: '#6b6b8a',
          inputBg: '#0f0f24'
        }
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'serif'],
        body: ['"EB Garamond"', 'serif'],
      }
    },
  },
  plugins: [],
}
