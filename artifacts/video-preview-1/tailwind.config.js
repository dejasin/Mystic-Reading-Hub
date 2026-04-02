/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        surface: "hsl(var(--surface))",
        gold: "hsl(var(--gold))",
        goldLight: "hsl(var(--gold-light))",
        cream: "hsl(var(--cream))",
        muted: "hsl(var(--muted))",
        input: "hsl(var(--input))",
      },
      fontFamily: {
        display: ['"Cinzel Decorative"', 'serif'],
        body: ['"EB Garamond"', 'serif'],
      }
    },
  },
  plugins: [],
}
