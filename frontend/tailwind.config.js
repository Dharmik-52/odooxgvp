/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ff-bg': '#0D1117',
        'ff-card': '#161B22',
        'ff-border': '#30363D',
        'ff-green': '#4ADE80',
        'ff-red': '#F87171',
        'ff-yellow': '#FACC15',
        'ff-blue': '#60A5FA',
      },
      fontFamily: {
        'mono': ['IBM Plex Mono', 'monospace'],
        'sans': ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
