/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coarc: {
          blue: '#0B2580',
          royal: '#1D4ED8',
          gold: '#D97706',
          amber: '#F59E0B',
          navy: '#0A1128',
          slate: '#0F172A',
          bglight: '#F8FAFC',
          cardlight: '#FFFFFF',
          softblue: '#EFF6FF',
          borderlight: '#DBEAFE'
        }
      }
    },
  },
  plugins: [],
}
