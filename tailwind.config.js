/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mc: {
          'green': '#5D8C3E',
          'dark-green': '#3B5C2A',
          'brown': '#8B6914',
          'dark-brown': '#5C4410',
          'stone': '#808080',
          'dark-stone': '#5A5A5A',
          'sky': '#87CEEB',
          'night': '#1a1a2e',
          'dirt': '#9B7653',
          'grass': '#5D8C3E',
          'water': '#3B7DD8',
          'redstone': '#B80000',
          'gold': '#FFAA00',
          'diamond': '#4AEDD9',
          'emerald': '#17DD62',
          'obsidian': '#1B1B2F',
          'nether': '#3D0C02'
        }
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'display': ['"Orbitron"', 'sans-serif'],
        'body': ['"Exo 2"', 'sans-serif']
      },
      boxShadow: {
        'mc': '0 4px 0 rgba(0,0,0,0.3)',
        'mc-sm': '0 2px 0 rgba(0,0,0,0.3)',
        'glow-green': '0 0 20px rgba(93, 140, 62, 0.5)',
        'glow-redstone': '0 0 20px rgba(184, 0, 0, 0.5)'
      }
    },
  },
  plugins: [],
}
