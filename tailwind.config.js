/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1a1b26',
        'bg-secondary': '#24283b',
        'text-primary': '#c0caf5',
        'text-secondary': '#7dcfff',
        'accent-primary': '#7aa2f7',
        'accent-secondary': '#bb9af7',
        'card-bg': '#1f2335',
      },
    },
  },
  plugins: [],
}
