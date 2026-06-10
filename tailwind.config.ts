import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './emails/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Raleway', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        script: ['Birthstone Bounce', 'cursive'],
      },
      colors: {
        brand: {
          DEFAULT: '#A90113',
          dark: '#763535',
          deep: '#5A2727',
          hover: '#8E0110',
        },
        blush: {
          DEFAULT: '#E5C4B8',
          light: '#FCEEE7',
        },
        cream: {
          DEFAULT: '#FAF6F5',
          dark: '#F8F3ED',
        },
        nhlb: {
          text: '#241F1E',
          muted: '#8A6A62',
          border: '#ECE3DC',
        },
      },
    },
  },
  plugins: [],
}

export default config
